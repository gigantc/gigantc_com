/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import './Sidebar.scss';

const SWIPE_CLOSE_THRESHOLD = 80;

const Sidebar = ({ open, onClose }) => {
  const [dragX, setDragX] = useState(0);
  const dragStartXRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setDragX(0);
  }, [open]);

  const handleTouchStart = (event) => {
    if (!open) return;
    dragStartXRef.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    if (dragStartXRef.current === null) return;
    const delta = event.touches[0].clientX - dragStartXRef.current;
    setDragX(delta < 0 ? delta : 0);
  };

  const handleTouchEnd = () => {
    if (dragStartXRef.current === null) return;
    dragStartXRef.current = null;
    const shouldClose = dragX <= -SWIPE_CLOSE_THRESHOLD;
    setDragX(0);
    if (shouldClose) onClose();
  };

  const dragStyle = dragX < 0
    ? { transform: `translateX(${dragX}px)`, transition: 'none' }
    : undefined;

  return (
    <>
      <div
        className={`sidebarBackdrop ${open ? 'isOpen' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`sidebar ${open ? 'isOpen' : ''}`}
        aria-hidden={!open}
        style={dragStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebarInner">
          {/* content goes here */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
