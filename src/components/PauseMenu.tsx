import React from 'react';
import { Player } from '../game/types';
import { WEAPON_REGISTRY } from '../game/weapons';
import { storage } from '../game/storage';
import { sound } from '../game/sound';
import { Play, RotateCcw, Home, Volume2, VolumeX, Activity } from 'lucide-react';

interface PauseMenuProps {
  player: Player;
  survivalTime: number;
  kills: number;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  player,
  survivalTime,
  kills,
  onResume,
  onRestart,
  onQuitToMenu,
}) => {
  const [sfxVol, setSfxVol] = React.useState(storage.getData().sfxVolume);
  const [musicVol, setMusicVol] = React.useState(storage.getData().musicVolume);
  const [screenShake, setScreenShake] = React.useState(storage.getData().screenShake);
  const [damageNumbers, setDamageNumbers] = React.useState(
    storage.getData().showDamageNumbers
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    sound.sfxVolume = val;
    storage.updateSettings({ sfxVolume: val });
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    sound.musicVolume = val;
    storage.updateSettings({ musicVolume: val });
  };

  const toggleScreenShake = () => {
    const next = !screenShake;
    setScreenShake(next);
    storage.updateSettings({ screenShake: next });
  };

  const toggleDamageNumbers = () => {
    const next = !damageNumbers;
    setDamageNumbers(next);
    storage.updateSettings({ showDamageNumbers: next });
  };

  const totalDamageDealt = player.weapons.reduce((acc, w) => acc + w.totalDamage, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black font-game text-slate-100 tracking-wider">
              GAME PAUSED
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Survived: {formatTime(survivalTime)} · Slain: {kills} · Gold: {player.gold}
            </p>
          </div>
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        </div>

        {/* Weapons DPS Damage Breakdown */}
        <div className="my-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-3">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>WEAPON DAMAGE BREAKDOWN</span>
          </div>

          <div className="flex flex-col gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            {player.weapons.map((w) => {
              const def = WEAPON_REGISTRY[w.id];
              const pct = Math.round((w.totalDamage / totalDamageDealt) * 100);
              const dps = Math.round(w.totalDamage / Math.max(1, survivalTime));

              return (
                <div key={w.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{def.icon}</span>
                      <span className="font-medium text-slate-200">
                        {def.name} <span className="text-slate-500 text-[11px]">Lv.{w.level}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>{w.totalDamage.toLocaleString()} dmg</span>
                      <span className="text-slate-500">({dps}/s)</span>
                      <span className="font-bold text-amber-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio & Settings */}
        <div className="flex flex-col gap-3 pb-5 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-300">AUDIO & SETTINGS</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* SFX Volume */}
            <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>SFX Volume</span>
                </span>
                <span className="font-mono">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Music Volume */}
            <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Music Volume</span>
                </span>
                <span className="font-mono">{Math.round(musicVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                className="accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs mt-1">
            <button
              onClick={toggleScreenShake}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                screenShake
                  ? 'border-amber-500/60 bg-amber-950/30 text-amber-300'
                  : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}
            >
              <span>Screen Shake:</span>
              <span className="font-bold">{screenShake ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={toggleDamageNumbers}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                damageNumbers
                  ? 'border-amber-500/60 bg-amber-950/30 text-amber-300'
                  : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}
            >
              <span>Damage Numbers:</span>
              <span className="font-bold">{damageNumbers ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Restart Run</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Quit to Title</span>
          </button>
        </div>
      </div>
    </div>
  );
};
