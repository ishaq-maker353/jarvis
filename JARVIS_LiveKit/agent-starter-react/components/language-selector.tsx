import React from 'react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  className?: string;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, className = "" }: LanguageSelectorProps) {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label 
        htmlFor="language-select" 
        className="text-[10px] font-bold uppercase tracking-widest text-cyan-600/80 pl-1"
      >
        Select Language:
      </label>
      <div className="relative group">
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full appearance-none bg-black/40 border border-cyan-900/50 rounded-lg pl-4 pr-10 py-2.5 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all group-hover:bg-black/60 shadow-[0_0_10px_rgba(6,182,212,0.05)] cursor-pointer backdrop-blur-sm"
        >
          <optgroup label="Indian Languages" className="bg-slate-950 text-cyan-500 font-sans font-semibold tracking-wider p-2">
            <option value="hi" className="text-cyan-100 font-mono font-normal">Hinglish</option>
            <option value="bn" className="text-cyan-100 font-mono font-normal">Bengali</option>
            <option value="ta" className="text-cyan-100 font-mono font-normal">Tamil</option>
            <option value="te" className="text-cyan-100 font-mono font-normal">Telugu</option>
            <option value="ml" className="text-cyan-100 font-mono font-normal">Malayalam</option>
            <option value="pa" className="text-cyan-100 font-mono font-normal">Punjabi</option>
            <option value="mr" className="text-cyan-100 font-mono font-normal">Marathi</option>
            <option value="gu" className="text-cyan-100 font-mono font-normal">Gujarati</option>
            <option value="kn" className="text-cyan-100 font-mono font-normal">Kannada</option>
            <option value="ur" className="text-cyan-100 font-mono font-normal">Urdu</option>
            <option value="as" className="text-cyan-100 font-mono font-normal">Assamese</option>
          </optgroup>
          <optgroup label="Foreign Languages" className="bg-slate-950 text-cyan-500 font-sans font-semibold tracking-wider p-2">
            <option value="en" className="text-cyan-100 font-mono font-normal">English</option>
            <option value="ja" className="text-cyan-100 font-mono font-normal">Japanese</option>
            <option value="es" className="text-cyan-100 font-mono font-normal">Spanish</option>
            <option value="de" className="text-cyan-100 font-mono font-normal">German</option>
            <option value="zh" className="text-cyan-100 font-mono font-normal">Chinese</option>
            <option value="ko" className="text-cyan-100 font-mono font-normal">Korean</option>
            <option value="fr" className="text-cyan-100 font-mono font-normal">French</option>
            <option value="ru" className="text-cyan-100 font-mono font-normal">Russian</option>
            <option value="ar" className="text-cyan-100 font-mono font-normal">Arabic</option>
          </optgroup>
        </select>
        
        {/* Custom HUD-style Dropdown Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cyan-600 group-hover:text-cyan-400 transition-colors">
          <svg className="w-4 h-4 fill-current drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
