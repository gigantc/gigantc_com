import { useState, useEffect } from 'react';
import './Header.scss';

const Header = () => {

  const [greeting, setGreeting] = useState("Hello");
  const [time, setTime] = useState({ hours: "00", minutes: "00", seconds: "00" });
  const [date, setDate] = useState("March 12 1979");

  

  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  // GREETING
  const getGreeting = () => {
    const hour = new Date().getHours();
    // Determine the greeting based on the time of day
    if (hour >= 5 && hour < 12) {
      return "Good Morning.";
    } else if (hour >= 12 && hour < 18) {
      return "Good Afternoon.";
    } else {
      return "Good Evening.";
    }
  };


  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  // TIME
  const formatTime = (num) => (num < 10 ? `0${num}` : num);

  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = formatTime(now.getMinutes());
    const seconds = formatTime(now.getSeconds());
  
    // Convert 24-hour time to 12-hour format
    hours = hours % 12 || 12; // Convert hour '0' to '12'
    hours = formatTime(hours); // Add leading zero if needed
  
    return {hours, minutes, seconds};
  };


  const getFormattedDate = () => {
    const today = new Date();
    
    // Get the full month name
    const options = { month: 'long' };
    const month = today.toLocaleString('en-US', options);
    
    // Get the day with leading zero if necessary
    const day = today.getDate().toString().padStart(2, '0');
    
    // Get the full year
    const year = today.getFullYear();
    
    return `${month} ${day} ${year}`;
  };
  


  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  // RUN-TIME
  // Set the greeting on component mount
  useEffect(() => {
    setGreeting(getGreeting());
    setDate(getFormattedDate());
  }, []);
  // Update the time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);
  
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);




  return (
    <>
      <header className="header">
        <div className="wrap">
          <div className="title">{greeting}</div>
          <div className="time">
            <span className="date">{date}</span>
            <span>{time.hours}</span>
            <span>{time.minutes}</span>
            <span>{time.seconds}</span>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

