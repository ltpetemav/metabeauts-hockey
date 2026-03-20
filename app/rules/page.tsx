'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Section = 'overview' | 'setup' | 'turns' | 'cards' | 'canshoot' | 'traits' | 'lines' | 'advanced' | 'faq';

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'overview', label: 'Overview', emoji: '🏒' },
  { id: 'setup', label: 'Setup & Roster', emoji: '📋' },
  { id: 'turns', label: 'Turn Flow', emoji: '🔄' },
  { id: 'cards', label: 'Cards & Resolution', emoji: '🃏' },
  { id: 'canshoot', label: 'canShoot', emoji: '🎯' },
  { id: 'traits', label: 'Traits', emoji: '✨' },
  { id: 'lines', label: 'Line Changes', emoji: '🔁' },
  { id: 'advanced', label: 'Advanced', emoji: '🧠' },
  { id: 'faq', label: 'FAQ', emoji: '❓' },
];

export default function RulesPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-black text-white">📖 Rules & FAQ</h1>
          <button
            onClick={() => router.push('/tutorial')}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
          >
            🎓 Try Tutorial →
          </button>
        </div>

        {/* Section Nav */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6 text-gray-200 leading-relaxed">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'setup' && <SetupSection />}
          {activeSection === 'turns' && <TurnsSection />}
          {activeSection === 'cards' && <CardsSection />}
          {activeSection === 'canshoot' && <CanShootSection />}
          {activeSection === 'traits' && <TraitsSection />}
          {activeSection === 'lines' && <LinesSection />}
          {activeSection === 'advanced' && <AdvancedSection />}
          {activeSection === 'faq' && <FAQSection />}
        </div>
      </div>
    </div>
  );
}

/* ─── Section Components ──────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-white mb-4">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-blue-300 mt-6 mb-2">{children}</h3>;
}

function OverviewSection() {
  return (
    <>
      <SectionTitle>🏒 MetaBeauts: Hockey</SectionTitle>
      <p className="mb-4">
        A <strong>2-player PvP digital card game</strong> built on the MetaBeauts NFT collection (9,997 Beauts on Ethereum).
        Each player drafts a team of 6 Beauts, then battles for goals in a fast-paced, asymmetric card game.
      </p>

      <SubTitle>Core Concept</SubTitle>
      <p className="mb-3">
        <strong>Offense draws randomly. Defense chooses deliberately.</strong> That&apos;s the fundamental asymmetry.
        The offensive player draws a card from their active Beaut&apos;s pile — they don&apos;t know what they&apos;ll get.
        The defensive player sees the drawn card and deliberately picks their counter.
      </p>

      <SubTitle>Win Condition</SubTitle>
      <p className="mb-3">
        <strong>First to 3 goals wins.</strong> Score by drawing a Shoot card when canShoot is active.
      </p>

      <SubTitle>Game Modes</SubTitle>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Pre-Season</strong> — Traits disabled. Learn the base card matchups.</li>
        <li><strong>Regular Season</strong> — Full trait system active. The real game.</li>
      </ul>
    </>
  );
}

function SetupSection() {
  return (
    <>
      <SectionTitle>📋 Setup & Roster</SectionTitle>
      <p className="mb-4">Each player drafts a team of <strong>6 Beauts</strong> from the MetaBeauts collection:</p>

      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Position</th>
              <th className="text-center py-2">Count</th>
              <th className="text-left py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-800"><td className="py-2">Winger</td><td className="text-center">2</td><td className="text-gray-400">Primary scorers</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2">Center</td><td className="text-center">1</td><td className="text-gray-400">Versatile playmaker</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2">Defender</td><td className="text-center">2</td><td className="text-gray-400">Defensive backbone</td></tr>
            <tr><td className="py-2">Goaltender</td><td className="text-center">1</td><td className="text-gray-400">Last line of defense</td></tr>
          </tbody>
        </table>
      </div>

      <p className="mb-3"><strong>3 on ice, 3 on bench.</strong> You choose who starts where.</p>

      <SubTitle>Tiers</SubTitle>
      <p className="mb-3">Every Beaut has a tier that determines their starting card count:</p>
      <ul className="list-disc list-inside space-y-1 ml-2">
        <li><strong>Rookie (Tier 1)</strong> — 4 cards</li>
        <li><strong>Pro (Tier 2)</strong> — 5 cards</li>
        <li><strong>All-Star (Tier 3)</strong> — 6 cards</li>
        <li><strong>Legend (Tier 4)</strong> — 7 cards</li>
      </ul>

      <SubTitle>Archetypes</SubTitle>
      <p>Each Beaut has an archetype that determines their special trait ability (see Traits section).</p>
    </>
  );
}

function TurnsSection() {
  return (
    <>
      <SectionTitle>🔄 Turn Flow</SectionTitle>

      <SubTitle>1. RPS — Who Goes First</SubTitle>
      <p className="mb-3">Rock-Paper-Scissors determines initial possession. Winner gets the puck.</p>

      <SubTitle>2. Line Change Window</SubTitle>
      <p className="mb-3">Before each possession, both players can optionally swap one Beaut between ice and bench. Skip if you&apos;re happy with your lineup.</p>

      <SubTitle>3. Offensive Draw</SubTitle>
      <p className="mb-3">The offensive player draws a random card from their active Beaut&apos;s action pile. They don&apos;t choose — the draw is random.</p>

      <SubTitle>4. Defensive Response</SubTitle>
      <p className="mb-3">The defensive player <strong>sees</strong> the drawn card and <strong>chooses</strong> a counter card from their active Beaut&apos;s pile.</p>

      <SubTitle>5. Trait Window</SubTitle>
      <p className="mb-3">Both players can activate their Beaut&apos;s forced trait (if available) before resolution. Once activated, the trait card is spent.</p>

      <SubTitle>6. Resolution</SubTitle>
      <p className="mb-3">Cards resolve according to the resolution matrix. The outcome determines possession, canShoot status, and whether a goal is scored.</p>

      <SubTitle>7. Repeat</SubTitle>
      <p>After resolution, play returns to the line change window for the next possession. Continue until someone scores 3 goals.</p>
    </>
  );
}

function CardsSection() {
  return (
    <>
      <SectionTitle>🃏 Cards & Resolution Matrix</SectionTitle>

      <SubTitle>Offensive Cards (Drawn Randomly)</SubTitle>
      <ul className="space-y-2 ml-2 mb-4">
        <li>🏒 <strong>Shoot</strong> — Attempt to score a goal. Only works if canShoot is TRUE.</li>
        <li>🏒 <strong>Pass</strong> — Move the puck up ice. Switches your active Beaut. Enables canShoot.</li>
        <li>🏒 <strong>Skate</strong> — Rush forward with the puck. Enables canShoot.</li>
      </ul>

      <SubTitle>Defensive Cards (Chosen Deliberately)</SubTitle>
      <ul className="space-y-2 ml-2 mb-4">
        <li>🛡️ <strong>Block</strong> — Stops Shoot. No effect on Pass or Skate.</li>
        <li>🛡️ <strong>Catch</strong> — Stops Shoot (goalie catches). No effect on Pass or Skate.</li>
        <li>🛡️ <strong>Steal</strong> — Intercepts Pass. No effect on Shoot or Skate.</li>
        <li>🛡️ <strong>Check</strong> — Body check stops Skate. No effect on Shoot or Pass.</li>
      </ul>

      <SubTitle>Resolution Matrix</SubTitle>
      <div className="bg-gray-800 rounded-xl p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Off ↓ / Def →</th>
              <th className="text-center py-2">Block</th>
              <th className="text-center py-2">Catch</th>
              <th className="text-center py-2">Steal</th>
              <th className="text-center py-2">Check</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-800">
              <td className="py-2 font-semibold">Shoot</td>
              <td className="text-center text-red-400">🛡️ Blocked</td>
              <td className="text-center text-red-400">🧤 Caught</td>
              <td className="text-center text-green-400">⚽ GOAL!</td>
              <td className="text-center text-green-400">⚽ GOAL!</td>
            </tr>
            <tr className="border-b border-gray-800">
              <td className="py-2 font-semibold">Pass</td>
              <td className="text-center text-green-400">✅ Pass wins</td>
              <td className="text-center text-green-400">✅ Pass wins</td>
              <td className="text-center text-red-400">💨 Stolen!</td>
              <td className="text-center text-green-400">✅ Pass wins</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Skate</td>
              <td className="text-center text-green-400">✅ Skate wins</td>
              <td className="text-center text-green-400">✅ Skate wins</td>
              <td className="text-center text-green-400">✅ Skate wins</td>
              <td className="text-center text-red-400">💥 Checked!</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        <strong>Green</strong> = offense wins. <strong>Red</strong> = defense wins. Each card has exactly one counter.
      </p>
    </>
  );
}

function CanShootSection() {
  return (
    <>
      <SectionTitle>🎯 canShoot</SectionTitle>
      <p className="mb-4">
        <strong>canShoot</strong> is the gatekeeper to scoring. You cannot score a goal until canShoot is TRUE.
      </p>

      <SubTitle>How to Activate canShoot</SubTitle>
      <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
        <li>Successfully complete a <strong>Pass</strong> (offense wins the resolution)</li>
        <li>Successfully complete a <strong>Skate</strong> (offense wins the resolution)</li>
      </ul>

      <SubTitle>What Resets canShoot</SubTitle>
      <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
        <li>After a <strong>Shoot attempt</strong> (hit or miss), canShoot resets to FALSE</li>
        <li><strong>Possession change</strong> — if defense wins and takes the puck, canShoot resets</li>
        <li><strong>New possession</strong> after a goal — both teams reset</li>
      </ul>

      <SubTitle>The Scoring Flow</SubTitle>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-center text-lg">
          <span className="text-blue-300">Pass/Skate</span>
          <span className="text-gray-500 mx-2">→</span>
          <span className="text-green-300">canShoot ON</span>
          <span className="text-gray-500 mx-2">→</span>
          <span className="text-yellow-300">Draw Shoot</span>
          <span className="text-gray-500 mx-2">→</span>
          <span className="text-red-300">⚽ GOAL!</span>
        </p>
      </div>

      <SubTitle>If You Draw Shoot Without canShoot</SubTitle>
      <p>The card is <strong>burned</strong> (discarded) and you automatically re-draw. You don&apos;t lose a turn, but you lose a card from your pile.</p>
    </>
  );
}

function TraitsSection() {
  return (
    <>
      <SectionTitle>✨ Traits</SectionTitle>
      <p className="mb-4">
        Each Beaut has a trait determined by their archetype. Traits come in two types:
      </p>

      <SubTitle>Forced Traits</SubTitle>
      <p className="mb-3">Held as a separate card. You choose when to activate during the Trait Window (after defense picks, before resolution). One-time use — once spent, it&apos;s gone.</p>

      <SubTitle>Natural Traits</SubTitle>
      <p className="mb-3">Mixed into the action pile. Drawn randomly like any other card. When drawn, the trait effect activates automatically.</p>

      <SubTitle>Trait List</SubTitle>
      <div className="space-y-3 mt-4">
        <TraitRow name="Sniper" type="Forced" effect="Shoot becomes UNBLOCKABLE — Block and Catch have no effect." />
        <TraitRow name="Enforcer" type="Forced" effect="Check stops ALL offensive cards (Shoot, Pass, AND Skate) this turn." />
        <TraitRow name="Power Forward" type="Forced" effect="Can Shoot even when canShoot is FALSE. Bypasses the requirement." />
        <TraitRow name="Two-Way" type="Forced" effect="Can play as either offense or defense. Flexible role switching." />
        <TraitRow name="Dangler" type="Forced" effect="Dodge a Check — Skate cannot be stopped this turn." />
        <TraitRow name="Playmaker" type="Natural" effect="Successful Pass gives +1 bonus card to the receiving Beaut." />
        <TraitRow name="Grinder" type="Natural" effect="When checked, recovers 1 spent card back to the pile." />
        <TraitRow name="Butterfly" type="Forced" effect="Goalie trait — Catch also returns the puck to defense (possession change)." />
        <TraitRow name="Stand-Up" type="Forced" effect="Goalie trait — Block is enhanced: reflects the shot back as a counter-attack." />
        <TraitRow name="Hybrid" type="Forced" effect="Goalie trait — Can use both Block and Catch effects in one play." />
        <TraitRow name="Puck Mover" type="Forced" effect="Defender trait — Pass cannot be intercepted by Steal." />
        <TraitRow name="Offensive Defenseman" type="Forced" effect="Defender trait — Can draw offensive cards with boosted effect." />
        <TraitRow name="Defensive Defenseman" type="Forced" effect="Defender trait — Check and Block are both effective this turn." />
        <TraitRow name="Two-Timer" type="Natural" effect="After a successful play, immediately draw a second card (bonus action)." />
      </div>
    </>
  );
}

function TraitRow({ name, type, effect }: { name: string; type: string; effect: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-white">{name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${type === 'Forced' ? 'bg-purple-900 text-purple-300' : 'bg-amber-900 text-amber-300'}`}>
          {type}
        </span>
      </div>
      <p className="text-sm text-gray-400">{effect}</p>
    </div>
  );
}

function LinesSection() {
  return (
    <>
      <SectionTitle>🔁 Line Changes</SectionTitle>
      <p className="mb-4">
        Before each possession, both players get a chance to swap one Beaut between the ice and the bench.
      </p>

      <SubTitle>How It Works</SubTitle>
      <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
        <li>Pick which on-ice Beaut goes to the <strong>bench</strong></li>
        <li>Pick which bench Beaut comes <strong>on ice</strong></li>
        <li>Choose 1 <strong>bonus card</strong> the incoming Beaut brings (offense or defense type — your choice)</li>
      </ol>

      <SubTitle>Bench Recovery</SubTitle>
      <p className="mb-3">Beauts on the bench slowly recover spent cards. A tired Beaut with 1 card left can rest on bench and come back with a refreshed pile.</p>

      <SubTitle>Exhaustion</SubTitle>
      <p className="mb-3">
        If a Beaut runs out of cards on ice, they&apos;re <strong>exhausted</strong>. They can&apos;t draw anymore.
        If ALL on-ice Beauts are exhausted, possession automatically flips to the opponent.
      </p>

      <SubTitle>Strategy</SubTitle>
      <p>Line changes are where roster management wins games. Don&apos;t run your stars dry — rotate them. Bring in the right Beaut for the right matchup.</p>
    </>
  );
}

function AdvancedSection() {
  return (
    <>
      <SectionTitle>🧠 Advanced Mechanics</SectionTitle>

      <SubTitle>Catch-Up Mechanic</SubTitle>
      <p className="mb-3">
        When a player falls behind by 2 goals, they receive <strong>2 bonus trait cards</strong> distributed to their on-ice Beauts.
        This keeps games competitive and prevents blowouts.
      </p>

      <SubTitle>Pass Switches Active Beaut</SubTitle>
      <p className="mb-3">
        A successful Pass doesn&apos;t just enable canShoot — it also <strong>switches your active offensive Beaut</strong> to another on-ice teammate.
        This simulates passing the puck to a different player.
      </p>

      <SubTitle>Card Pile Management</SubTitle>
      <p className="mb-3">
        Every draw costs a card. Every defensive play costs a card. Managing your pile is critical:
      </p>
      <ul className="list-disc list-inside space-y-1 ml-2 mb-4">
        <li>Higher-tier Beauts have more cards (Legends start with 7)</li>
        <li>Watch your opponent&apos;s card counts — attack when they&apos;re low</li>
        <li>Use line changes to rotate tired Beauts to bench for recovery</li>
      </ul>

      <SubTitle>Offense-Random / Defense-Deliberate</SubTitle>
      <p className="mb-3">
        This asymmetry is the heart of the game. Offense can&apos;t control what they draw — they play the hand they&apos;re dealt.
        Defense sees the draw and reacts. The skill is in reading patterns, managing resources, and knowing when to activate traits.
      </p>

      <SubTitle>Goalie Positioning</SubTitle>
      <p>
        Your Goaltender doesn&apos;t need to be on-ice to play defense — they&apos;re always available as the last line.
        But their trait cards (Butterfly, Stand-Up, Hybrid) only activate when they&apos;re the active defensive Beaut.
      </p>
    </>
  );
}

function FAQSection() {
  return (
    <>
      <SectionTitle>❓ Frequently Asked Questions</SectionTitle>

      <FAQ q="What happens if I draw Shoot but canShoot is FALSE?">
        The Shoot card is <strong>burned</strong> (discarded) and you automatically re-draw from your pile.
        You don&apos;t lose your turn, but you do lose a card. This makes pile management important.
      </FAQ>

      <FAQ q="Can both players activate traits at the same time?">
        Yes! The Trait Window opens for both players after the defensive card is selected but before resolution.
        Both can activate their forced trait if available. Traits can interact — e.g., a Sniper trait vs a Butterfly goalie.
      </FAQ>

      <FAQ q="What happens when a player runs out of cards?">
        If your active Beaut&apos;s pile is empty, they&apos;re <strong>exhausted</strong>. If all your on-ice Beauts are exhausted,
        possession flips to the opponent. Use line changes to prevent this.
      </FAQ>

      <FAQ q="Does defense lose cards too?">
        Yes. Every defensive card played is removed from that Beaut&apos;s pile. Defense can run out of cards just like offense.
      </FAQ>

      <FAQ q="How do bench Beauts recover?">
        Beauts on the bench slowly regain spent cards over time. The exact recovery rate depends on game mode,
        but resting a Beaut for a few turns usually refreshes their pile significantly.
      </FAQ>

      <FAQ q="What determines which Beaut is 'active' on defense?">
        The game automatically selects a defensive Beaut based on who has cards available.
        The Goaltender is always involved as last line of defense.
      </FAQ>

      <FAQ q="Can I play without MetaBeauts NFTs?">
        Yes! The current version lets you browse and pick from any of the 9,997 MetaBeauts in the collection.
        No wallet connection required. Future versions may add wallet-verified ownership for ranked play.
      </FAQ>

      <FAQ q="What is All-Star Mode?">
        A future game mode where both players stake real NFTs. The winner receives the loser&apos;s NFT via smart contract escrow.
        Both players must agree to All-Star Mode before the match begins.
      </FAQ>

      <FAQ q="Is this game on-chain?">
        The NFT metadata (names, archetypes, tiers, images) is read from the Ethereum blockchain via Bueno.
        The game engine itself runs client-side. Future versions will add on-chain match results and ranked ladders.
      </FAQ>
    </>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-800 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between hover:text-white transition-colors"
      >
        <span className="font-medium text-gray-200">{q}</span>
        <span className="text-gray-500 ml-2">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="mt-2 text-sm text-gray-400 pl-2">{children}</p>}
    </div>
  );
}
