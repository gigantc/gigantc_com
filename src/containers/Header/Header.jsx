import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MenuIcon from '@/assets/menu.svg?react';
import CloseIcon from '@/assets/close.svg?react';
import Sidebar from '@/components/Sidebar/Sidebar';
import './Header.scss';

const pad = (num) => (num < 10 ? `0${num}` : num);


//////////////////////////////////////
// GREETING
const getGreeting = () => {
  const hour = new Date().getHours();
  // Determine the greeting based on the time of day
  if (hour >= 5 && hour < 12) return 'Good Morning.';
  if (hour >= 12 && hour < 18) return 'Good Afternoon.';
  return 'Good Evening.';
};


//////////////////////////////////////
// TIME
const getCurrentTime = () => {
  const now = new Date();
  // Convert 24-hour time to 12-hour format with leading zeros
  const hours = pad(now.getHours() % 12 || 12);
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return { hours, minutes, seconds };
};


//////////////////////////////////////
// DATE
const getFormattedDate = () => {
  const today = new Date();
  const month = today.toLocaleString('en-US', { month: 'long' });
  const day = today.getDate().toString().padStart(2, '0');
  return `${month} ${day} ${today.getFullYear()}`;
};

const Header = () => {
  const location = useLocation();
  const isDoomscroll = location.pathname === '/doomscroll';

  const [greeting, setGreeting] = useState('Hello');
  const [time, setTime] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [date, setDate] = useState('March 12 1979');
  const [menuOpen, setMenuOpen] = useState(false);

  //////////////////////////////////////
  // RUN-TIME
  // Set the greeting and date on mount
  useEffect(() => {
    setGreeting(getGreeting());
    setDate(getFormattedDate());
  }, []);

  // Update the time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(getCurrentTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className={`header${isDoomscroll ? ' header--doomscroll' : ''}`}>
        <div className="wrap">
          {isDoomscroll && (
            <button
              type="button"
              className="menuButton"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          )}
          <div className="title">{greeting}</div>
          <div className="time">
            <span className="date">{date}</span>
            <div className="clock">
              <span>{time.hours}</span>
              <span>{time.minutes}</span>
              <span>{time.seconds}</span>
            </div>
          </div>
        </div>
      </header>
      {isDoomscroll && <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />}
    </>
  );
};

export default Header;
