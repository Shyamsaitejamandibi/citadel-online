# Interface implementation

The interface-polish skill was applied to the new application. The comparison below covers the implemented changes by principle.

| Before                               | After                                                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty Next.js starter                | A parchment and emerald app shell with original artwork, a responsive navigation rail, a game lobby, card collection and rules guide.                          |
| No visual assets                     | Original city painting, eight character portraits, and 28 individual district illustrations in `public/art/`, with WebP assets used in the UI.                 |
| Default typography                   | Self-hosted DM Sans and Cormorant Garamond, font smoothing, balanced headings, readable secondary copy, and tabular counters in `src/app/globals.css`.         |
| No surface system                    | Nested rounded cards and dialogs with restrained borders, layered shadows, and card image outlines.                                                            |
| Default shadcn button transitions    | Explicit transition properties and 0.96 press scaling in `src/components/ui/button.tsx`; no global `transition: all`.                                          |
| No interaction hierarchy             | Hover elevation, selected card outlines, turn steps, character ranks, district color markers, build costs, confirmation actions, and disabled illegal moves.   |
| No reduced-motion behavior           | Reduced-motion CSS suppresses animations and transforms; waiting animations are limited to small status indicators.                                            |
| No keyboard or screen-reader support | Named controls, visible focus rings, accessible shadcn dialogs, semantic page headings, and polite turn announcements.                                         |
| No mobile layout                     | Navigation becomes a compact header, play choices stack, table actions precede the board, rival seats scroll, cards reflow, and chat moves below the city.     |
| Manual tabletop bookkeeping          | Guided resource gathering, legal build checks, automatic role bonuses, crown tracking, a game journal, score breakdowns and preserved results after rematches. |
| No session continuity                | Server-persisted state, per-player private views, reconnect polling, same-browser seat restoration, saved table history, and host-controlled bot replacement.  |

Visual verification screenshots are in `artifacts/`. Browser testing includes 1440px desktop and 390px mobile viewports, with an explicit check for horizontal page overflow. Touch targets for navigation and primary controls are at least 40px.
