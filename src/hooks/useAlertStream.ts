import { useEffect, useCallback, useRef } from 'react';
import type { Alert } from '../types';

interface AudioContextConstructor {
  new (): AudioContext;
}

/**
 * 模拟实时告警推送
 * @param alerts 告警数据源
 * @param onNewAlert 新告警回调
 * @param interval 推送间隔（毫秒）
 */
export function useAlertStream(
  alerts: Alert[],
  onNewAlert: (alert: Alert) => void,
  interval: number = 8000
) {
  const alertsRef = useRef<Alert[]>(alerts);

  /**
   * 使用 Web Audio API 播放提示音
   */
  const playAlertSound = useCallback(() => {
    try {
      const win = window as unknown as {
        AudioContext: AudioContextConstructor;
        webkitAudioContext?: AudioContextConstructor;
      };
      const Ctx = win.AudioContext || win.webkitAudioContext;
      if (!Ctx) return;

      const audioContext = new Ctx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.warn('无法播放提示音:', error);
    }
  }, []);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    if (alertsRef.current.length === 0) return;

    const timer = setInterval(() => {
      // 从现有告警中随机选择一条，生成"新告警"
      const sourceAlert = alertsRef.current[Math.floor(Math.random() * alertsRef.current.length)];
      if (!sourceAlert) return;

      const newAlert: Alert = {
        ...sourceAlert,
        id: `${sourceAlert.id}-${Date.now()}`,
        time: new Date().toLocaleString('zh-CN'),
        status: '新发现',
      };

      playAlertSound();
      onNewAlert(newAlert);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, onNewAlert, playAlertSound]);
}
