import asyncio
import json
from typing import Dict, List, Any, AsyncGenerator


class EventStreamManager:
    """
    In-memory Server-Sent Events (SSE) broadcaster for live agent execution streaming.
    """

    def __init__(self):
        self._listeners: Dict[str, List[asyncio.Queue]] = {}

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

    async def broadcast(self, conversation_id: str, event_type: str, data: Any):
        """Broadcasts an event message to all connected clients for a conversation."""
        if conversation_id in self._listeners:
            payload = {
                "event": event_type,
                "data": data,
            }
            for q in list(self._listeners[conversation_id]):
                await q.put(payload)

    async def event_generator(self, conversation_id: str) -> AsyncGenerator[str, None]:
        """Generates formatted SSE data stream for FastAPI StreamingResponse."""
        queue = self.subscribe(conversation_id)
        try:
            while True:
                # Wait for next event
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
