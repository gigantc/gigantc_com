import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FeedItem from '@/components/FeedItem/FeedItem';

const FeedsList = ({ feeds, onDragEnd, onEditFeed, onDeleteFeed }) => {
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  //////////////////////////////////////
  // RENDER
  return (
    <div className="feedsList">
      <h3>Feeds ({feeds.length})</h3>
      {feeds.length === 0 ? (
        <p className="noFeeds">No feeds configured yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={feeds.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="feedsTable">
              {feeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  onEdit={onEditFeed}
                  onDelete={onDeleteFeed}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default FeedsList;
