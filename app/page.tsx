'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Featured Beaut token IDs for the hero banner — a curated mix of positions/tiers
const HERO_BEAUT_IDS = [42, 88, 155, 314, 501, 777, 1234, 2500];
const SHOWCASE_IDS = [1, 42, 88, 155, 314, 501, 777, 999, 1234, 1500, 2000, 2500];

function beautImageUrl(tokenId: number) {
  return `https://assets.bueno.art/images/b93fd12b-3c56-4f5d-9277-fa952f95cffb/default/${tokenId}`;
}

export default function HomePage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#071226] overflow-x-hidden">
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#071226] via-[#0b1730] to-[#0d1f3c]" />
        
        {/* Starfield / arena light effect */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(13,184,255,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 20% 80%, rgba(0,216,255,0.05) 0%, transparent 40%),
                              radial-gradient(circle at 80% 80%, rgba(0,178,230,0.05) 0%, transparent 40%)`,
          }}
        />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/20 animate-pulse"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Small badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            9,997 Beauts on Ethereum
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tight"
            style={{
              textShadow: '0 0 80px rgba(0,216,255,0.3), 0 0 40px rgba(0,216,255,0.1)',
            }}
          >
            META<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">BEAUTS</span>
          </h1>
          <h2 className="text-3xl md:text-5xl font-black text-white/90 mb-6 tracking-tight">
            : HOCKEY
          </h2>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            A 2-player PvP digital card game. Random offense, deliberate defense.
            <br className="hidden md:block" />
            Draft your roster. Hit the ice. First to 3 goals wins.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => router.push('/roster')}
              className="group relative px-10 py-4 rounded-full font-bold text-lg text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, #00d8ff 0%, #00b2e6 100%)',
                boxShadow: '0 6px 24px rgba(0,216,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <span className="relative z-10">🎮 Start Game</span>
            </button>
            <button
              onClick={() => router.push('/tutorial')}
              className="px-10 py-4 rounded-full font-bold text-lg text-cyan-300 border-2 border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm"
            >
              🎓 Learn to Play
            </button>
            <button
              onClick={() => router.push('/rules')}
              className="px-10 py-4 rounded-full font-bold text-lg text-gray-300 border-2 border-gray-600 hover:border-gray-400 hover:bg-white/5 transition-all duration-300 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm"
            >
              📖 Rules
            </button>
          </div>
        </div>

        {/* Character art row — overlapping bottom edge */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <div className="flex justify-center items-end -space-x-4 md:-space-x-6">
            {HERO_BEAUT_IDS.map((id, i) => (
              <div
                key={id}
                className="relative transition-transform duration-500 hover:scale-110 hover:-translate-y-4 hover:z-20"
                style={{
                  zIndex: i < 4 ? i : 7 - i,
                  transform: `translateY(${Math.abs(i - 3.5) * 8}px)`,
                }}
              >
                <div className="relative">
                  <img
                    src={beautImageUrl(id)}
                    alt={`Beaut #${id}`}
                    className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl object-cover border-2 border-white/20 shadow-2xl"
                    style={{
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0,216,255,0.15)',
                    }}
                    loading="eager"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-white/50 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══ ICE TRANSITION ═══ */}
      <div className="h-32 bg-gradient-to-b from-[#0d1f3c] to-[#cfe7f6]" />

      {/* ═══ HOW IT WORKS — on ice background ═══ */}
      <section className="relative py-20"
        style={{
          background: 'linear-gradient(180deg, #cfe7f6 0%, #b6d9ee 40%, #a8d0e8 100%)',
        }}
      >
        {/* Ice texture overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          {/* Section heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#071226] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[#071226]/60 max-w-2xl mx-auto">
              Draft. Draw. Defend. Score. The core loop in 4 steps.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '📋', title: 'Draft Your Roster', desc: '6 Beauts — 2 Wingers, 1 Center, 2 Defenders, 1 Goalie. Choose from 9,997 real NFTs.' },
              { emoji: '🎲', title: 'Offense Draws', desc: 'You don\'t choose your card — you draw randomly from your Beaut\'s pile. Shoot, Pass, or Skate.' },
              { emoji: '🛡️', title: 'Defense Chooses', desc: 'Defense sees your card and deliberately picks their counter. Block, Catch, Steal, or Check.' },
              { emoji: '🚨', title: 'Score Goals', desc: 'Pass or Skate to activate canShoot, then draw Shoot for a goal. First to 3 wins.' },
            ].map((step, i) => (
              <div
                key={i}
                className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/50"
              >
                <div className="text-4xl mb-4">{step.emoji}</div>
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#071226] text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-[#071226] mb-2">{step.title}</h3>
                <p className="text-[#071226]/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RESOLUTION MATRIX — dark section ═══ */}
      <section className="relative py-20 bg-[#071226]">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(0,216,255,0.15) 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Resolution Matrix</span>
            </h2>
            <p className="text-lg text-gray-400">Every card has exactly one counter. Learn the matchups.</p>
          </div>

          <div className="bg-[#0b1730] border border-cyan-500/20 rounded-2xl p-6 overflow-x-auto shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(0,216,255,0.08)' }}
          >
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold">Off ↓ / Def →</th>
                  <th className="text-center py-3 px-2">🛡️ Block</th>
                  <th className="text-center py-3 px-2">🧤 Catch</th>
                  <th className="text-center py-3 px-2">💨 Steal</th>
                  <th className="text-center py-3 px-2">💥 Check</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-2 font-bold text-white">🏒 Shoot</td>
                  <td className="text-center py-3 text-red-400 font-medium">Blocked</td>
                  <td className="text-center py-3 text-red-400 font-medium">Caught</td>
                  <td className="text-center py-3 text-green-400 font-bold">⚽ GOAL!</td>
                  <td className="text-center py-3 text-green-400 font-bold">⚽ GOAL!</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-2 font-bold text-white">🏒 Pass</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                  <td className="text-center py-3 text-red-400 font-medium">Stolen!</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-bold text-white">🏒 Skate</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                  <td className="text-center py-3 text-green-400 font-medium">✅ Wins</td>
                  <td className="text-center py-3 text-red-400 font-medium">Checked!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ BEAUT SHOWCASE — ice section ═══ */}
      <section className="relative py-20"
        style={{
          background: 'linear-gradient(180deg, #b6d9ee 0%, #cfe7f6 50%, #b6d9ee 100%)',
        }}
      >
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-[#071226] mb-4">
              Meet the Beauts
            </h2>
            <p className="text-lg text-[#071226]/60">9,997 unique hockey players. Each with their own position, archetype, tier, and trait.</p>
          </div>

          {/* Scrolling showcase */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SHOWCASE_IDS.map((id) => (
              <div
                key={id}
                className="group relative bg-[#071226] rounded-xl overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-cyan-500/20"
              >
                <img
                  src={beautImageUrl(id)}
                  alt={`Beaut #${id}`}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs font-bold text-white text-center">#{id}</p>
                </div>
                <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/10 transition-colors duration-300" />
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/roster')}
              className="px-8 py-3 rounded-full font-bold text-[#071226] transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00d8ff, #00b2e6)',
                boxShadow: '0 4px 16px rgba(0,216,255,0.3)',
              }}
            >
              Browse All 9,997 →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — dark section ═══ */}
      <section className="relative py-20 bg-[#071226]">
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Game Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '⚔️', title: 'Asymmetric Gameplay', desc: 'Offense draws randomly. Defense chooses deliberately. The core tension that makes every play matter.' },
              { emoji: '✨', title: '14 Unique Traits', desc: 'Sniper, Enforcer, Butterfly, Dangler, and more. Each archetype has a special ability that can flip a play.' },
              { emoji: '🔄', title: 'Line Changes', desc: 'Swap tired Beauts for fresh ones from the bench. Strategic substitutions win games.' },
              { emoji: '📈', title: 'Tier System', desc: 'Rookie to Legend. Higher tier = more cards in the pile. Legends start with 7 cards.' },
              { emoji: '🎯', title: 'canShoot Mechanic', desc: 'Can\'t shoot on first draw. Earn your shot with a successful Pass or Skate first.' },
              { emoji: '🏆', title: 'Catch-Up System', desc: 'Down by 2? Get bonus trait cards. Games stay competitive until the final whistle.' },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#0b1730] border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
              >
                <div className="text-3xl mb-3">{feature.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER — teal/cyan ═══ */}
      <section className="relative py-16"
        style={{
          background: 'linear-gradient(135deg, #00b2e6 0%, #0f9fb8 100%)',
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Hit the Ice?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            No wallet required. No sign-up. Just pick your Beauts and play.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/roster')}
              className="px-10 py-4 rounded-full font-bold text-lg text-[#071226] bg-white hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              🎮 Start Game
            </button>
            <button
              onClick={() => router.push('/tutorial')}
              className="px-10 py-4 rounded-full font-bold text-lg text-white border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              🎓 Learn to Play
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#050e1d] py-8 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 text-sm">
              <span className="font-bold text-gray-400">MB:H</span> — MetaBeauts: Hockey • Phase 1 MVP
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="https://metabeauts.io" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                MetaBeauts.io
              </a>
              <a href="https://opensea.io/collection/metabeauts" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                OpenSea
              </a>
              <button onClick={() => router.push('/rules')} className="hover:text-cyan-400 transition-colors">
                Rules
              </button>
            </div>
            <div className="text-gray-600 text-xs">
              Real MetaBeauts NFT data • No wallet required
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
