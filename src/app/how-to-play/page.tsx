import Link from "next/link";
import { Castle, ArrowRight, Lightbulb } from "lucide-react";
export const metadata = { title: "How to play" };
export default function Page() {
  return (
    <main className="page-content">
      <div className="page-intro">
        <p className="eyebrow">A FIELD GUIDE FOR ASPIRING RULERS</p>
        <h1>Your first city starts here.</h1>
        <p>
          A little strategy. A little bluffing. A very good reason to distrust
          your friends. Here’s everything you need to take your seat.
        </p>
      </div>
      <section className="guide-hero">
        <Castle strokeWidth={1} />
        <div>
          <h2>Build a city worthy of the crown.</h2>
          <p>
            Grow your city with district cards, use secret character powers to
            get ahead, and earn the most points. When someone builds their
            eighth district, finish the round and score every city. In a shorter
            game, the finish line is seven.
          </p>
        </div>
      </section>
      <div className="guide-steps">
        <section className="guide-step">
          <span>01</span>
          <h3>Choose an identity.</h3>
          <p>
            Each round, the crown holder chooses first. Select a secret
            character, then pass the remaining choices around the table. Every
            character has a different power. A new round means a fresh identity.
          </p>
        </section>
        <section className="guide-step">
          <span>02</span>
          <h3>Make your move.</h3>
          <p>
            Characters take their turns in rank order, from Assassin to Warlord.
            Gather two gold, or draw two cards and keep one. Use your power and
            pay gold to build one district from your hand.
          </p>
        </section>
        <section className="guide-step">
          <span>03</span>
          <h3>Leave a legacy.</h3>
          <p>
            Your districts are worth their gold costs in points. Build all five
            colors for a bonus, and finish your city first for another. The
            biggest city doesn’t always win — make your gold count.
          </p>
        </section>
      </div>
      <Link href="/" className="inline-link">
        Ready to build something great?
        <ArrowRight size={16} />
      </Link>
      <div className="guide-details">
        <section>
          <h2>Every point counts.</h2>
          <div className="score-line">
            <span>Districts in your city</span>
            <strong>Their gold value</strong>
          </div>
          <div className="score-line">
            <span>All five district colors</span>
            <strong>+3 points</strong>
          </div>
          <div className="score-line">
            <span>First completed city</span>
            <strong>+4 points</strong>
          </div>
          <div className="score-line">
            <span>Other completed cities</span>
            <strong>+2 points</strong>
          </div>
          <div className="score-line">
            <span>University or Dragon Gate</span>
            <strong>+2 points each</strong>
          </div>
          <p className="mt-5">
            Tied scores are settled by the total gold value of built districts,
            then by gold remaining. If those also tie, the victory is shared. We
            do all the counting for you.
          </p>
        </section>
        <section>
          <h2>The finer details.</h2>
          <details>
            <summary>What do I start with?</summary>
            <p>
              Four district cards, two gold, and a lot of ambition. The host
              takes the first crown at this online table. The King can claim it
              in later rounds.
            </p>
          </details>
          <details>
            <summary>Can I build two of the same district?</summary>
            <p>
              No. Every district in your city must have a different name. The
              Architect can build three districts in one turn; other characters
              can build one.
            </p>
          </details>
          <details>
            <summary>How do smaller tables work?</summary>
            <p>
              With two or three players, you each choose two characters and take
              a separate turn for each. Your hand, city, and gold are shared
              between both turns. At two players, the middle two picks also set
              one character aside. The game guides you through every step.
            </p>
          </details>
          <details>
            <summary>Which characters sit out?</summary>
            <p>
              One character is set aside secretly each round. With four players,
              two additional characters sit out face up; with five, one sits out
              face up. The King is never removed face up. At seven players, the
              last player may also choose the secretly removed character.
            </p>
          </details>
          <details>
            <summary>When can I use a character power?</summary>
            <p>
              Use your optional power once during your turn, before or after
              gathering and building. Income is collected once, so collecting
              after building a matching district can earn more gold. The King’s
              crown, Merchant’s bonus, and Architect’s extra cards are handled
              automatically.
            </p>
          </details>
          <details>
            <summary>Who is protected from the Warlord?</summary>
            <p>
              Completed cities, the Keep district, and the Bishop’s city cannot
              be destroyed. An assassinated Bishop loses that protection. The
              Great Wall adds one gold to the cost of destroying other
              districts.
            </p>
          </details>
          <details>
            <summary>What happens to an assassinated King?</summary>
            <p>
              Their turn is skipped, but they receive the crown at the end of
              the round. Their identity stays hidden until then.
            </p>
          </details>
          <details>
            <summary>What if someone disconnects?</summary>
            <p>
              Return to the same link in the same browser to resume your seat.
              The table waits for everyone. If someone has left for good, the
              host can put their seat on autopilot in table settings so the rest
              of you can finish.
            </p>
          </details>
        </section>
      </div>
      <div className="hint-box">
        <Lightbulb size={17} />
        <span>
          First game? Open the Player aid card at the table. It’s the same
          summary you’d find in the box. Read your character’s power, take gold
          when you’re short, and try building a mix of district colors.
        </span>
      </div>
      <Link href="/collection" className="inline-link mt-5">
        Explore every character and district
        <ArrowRight size={15} />
      </Link>
    </main>
  );
}
