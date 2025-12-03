import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditIcon from '@/assets/edit.svg?react';
import DeleteIcon from '@/assets/delete.svg?react';

const FeedItem = ({ feed, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feed.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  //////////////////////////////////////
  // VALIDATE URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };


  //////////////////////////////////////
  // HANDLE EDIT CLICK
  const handleEditClick = () => {
    setIsEditing(true);
    setEditTitle(feed.feedTitle);
    setEditUrl(feed.feedUrl);
  };


  //////////////////////////////////////
  // HANDLE CANCEL
  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditUrl('');
  };


  //////////////////////////////////////
  // HANDLE SAVE
  const handleSave = async () => {
    if (!editTitle.trim() || !editUrl.trim()) {
      return;
    }

    if (!isValidUrl(editUrl)) {
      alert('Please enter a valid URL');
      return;
    }

    try {
      await onEdit(feed.id, { feedTitle: editTitle, feedUrl: editUrl });
      setIsEditing(false);
      setEditTitle('');
      setEditUrl('');
    } catch (err) {
      alert(err.message);
    }
  };


  //////////////////////////////////////
  // HANDLE DELETE
  const handleDelete = () => {
    if (confirm(`Delete "${feed.feedTitle}"?`)) {
      onDelete(feed.id, feed.feedTitle);
    }
  };


  //////////////////////////////////////
  // RENDER
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`feedItem ${isDragging ? 'dragging' : ''}`}
    >
      {isEditing ? (
        // EDIT MODE
        <div className="editMode">
          <div className="dragHandle disabled" title="Cannot drag while editing">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="7" cy="5" r="1.5" />
              <circle cx="13" cy="5" r="1.5" />
              <circle cx="7" cy="10" r="1.5" />
              <circle cx="13" cy="10" r="1.5" />
              <circle cx="7" cy="15" r="1.5" />
              <circle cx="13" cy="15" r="1.5" />
            </svg>
          </div>
          <div className="editContent">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="editInput"
            />
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="editInput"
            />
            <div className="editActions">
              <button onClick={handleSave} className="btnSave">
                Save
              </button>
              <button onClick={handleCancel} className="btnCancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        // VIEW MODE
        <div className="viewMode">
          <div className="dragHandle" {...attributes} {...listeners} title="Drag to reorder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="7" cy="5" r="1.5" />
              <circle cx="13" cy="5" r="1.5" />
              <circle cx="7" cy="10" r="1.5" />
              <circle cx="13" cy="10" r="1.5" />
              <circle cx="7" cy="15" r="1.5" />
              <circle cx="13" cy="15" r="1.5" />
            </svg>
          </div>
          <div className="feedInfo">
            <h4>{feed.feedTitle}</h4>
          </div>
          <div className="feedActions">
            <button
              onClick={handleEditClick}
              className="btnEdit"
              title="Edit feed"
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              className="btnDelete"
              title="Delete feed"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedItem;
