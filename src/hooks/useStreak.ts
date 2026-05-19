import { useState, useEffect } from 'react';

interface StreakData {
  lastLoginDate: string;
  streakCount: number;
}

export function useStreak() {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    const todayStr = new Date().toDateString();
    const stored = localStorage.getItem('philosophy_streak');
    
    if (stored) {
      try {
        const data: StreakData = JSON.parse(stored);
        const lastLogin = new Date(data.lastLoginDate);
        const today = new Date(todayStr);
        
        // Reset hours to midnight to compare just dates
        lastLogin.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - lastLogin.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Logged in yesterday -> increment streak
          const newStreak = data.streakCount + 1;
          setStreak(newStreak);
          localStorage.setItem('philosophy_streak', JSON.stringify({ lastLoginDate: todayStr, streakCount: newStreak }));
        } else if (diffDays === 0) {
          // Logged in today -> keep same streak
          setStreak(data.streakCount);
        } else if (diffDays > 1) {
          // Missed a day -> reset to 1
          setStreak(1);
          localStorage.setItem('philosophy_streak', JSON.stringify({ lastLoginDate: todayStr, streakCount: 1 }));
        }
      } catch (e) {
        console.error('Failed to parse streak data', e);
        localStorage.setItem('philosophy_streak', JSON.stringify({ lastLoginDate: todayStr, streakCount: 1 }));
      }
    } else {
      // First time using the app
      localStorage.setItem('philosophy_streak', JSON.stringify({ lastLoginDate: todayStr, streakCount: 1 }));
    }
  }, []);

  return streak;
}
