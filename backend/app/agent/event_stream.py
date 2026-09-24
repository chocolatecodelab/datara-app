import asyncio
import json
from typing import Dict, List, Any, AsyncGenerator


class EventStreamManager:
    """
    In-memory Server-Sent Events (SSE) broadcaster for live agent execution streaming.
    Includes replay buffer to prevent race conditions between POST creation and SSE connection.
    """

    def __init__(self):
        self._listeners: Dict[str, List[asyncio.Queue]] = {}
        self._history: Dict[str, List[Dict[str, Any]]] = {}

    def subscribe(self, conversation_id: str) -> asyncio.Queue:
        """Subscribes a client connection to a conversation event stream."""
        queue = asyncio.Queue()
        if conversation_id not in self._listeners:
            self._listeners[conversation_id] = []
        self._listeners[conversation_id].append(queue)
        return queue

    def unsubscribe(self, conversation_id: str, queue: asyncio.Queue):
        """Unsubscribes a client connection."""
        if conversation_id in self._listeners:
            if queue in self._listeners[conversation_id]:
                self._listeners[conversation_id].remove(queue)
            if not self._listeners[conversation_id]:
                del self._listeners[conversation_id]

    def broadcast_sync(self, conversation_id: str, event_type: str, data: Any):
        """
        Thread-safe synchronous broadcast for background threads.
        Pushes event to listeners and logs to history replay buffer.
        """
        payload = {
            "event": event_type,
            "data": data,
        }
        if conversation_id not in self._history:
            self._history[conversation_id] = []
        self._history[conversation_id].append(payload)

        if conversation_id in self._listeners:
            for q in list(self._listeners[conversation_id]):
                try:
                    q.put_nowait(payload)
                except Exception:
                    pass

    async def broadcast(self, conversation_id: str, event_type: str, data: Any):
        """Broadcasts an event message to all connected clients for a conversation."""
        self.broadcast_sync(conversation_id, event_type, data)

    def get_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Returns recorded event history for a conversation."""
        return list(self._history.get(conversation_id, []))

    async def event_generator(self, conversation_id: str) -> AsyncGenerator[str, None]:
        """Generates formatted SSE data stream for FastAPI StreamingResponse with history replay."""
        queue = self.subscribe(conversation_id)
        already_emitted_count = 0

        try:
            # 1. Replay historical events if any exist
            history = self.get_history(conversation_id)
            has_terminal_event = False
            for message in history:
                event_name = message.get("event", "message")
                data_json = json.dumps(message.get("data", {}))
                yield f"event: {event_name}\ndata: {data_json}\n\n"
                already_emitted_count += 1
                if event_name in ("complete", "failed"):
                    has_terminal_event = True
                    break

            if has_terminal_event:
                return

            # 2. Drain any events already in queue that were caught in replay
            for _ in range(already_emitted_count):
                if not queue.empty():
                    try:
                        queue.get_nowait()
                    except Exception:
                        pass

            # 3. Stream ongoing live events
            while True:
                message = await queue.get()
                event_name = message.get("event", "message")
                data_json = json.dumps(message.get("data", {}))
                yield f"event: {event_name}\ndata: {data_json}\n\n"

                # If conversation is complete or failed, terminate stream after emission
                if event_name in ("complete", "failed"):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            self.unsubscribe(conversation_id, queue)


event_stream_manager = EventStreamManager()
