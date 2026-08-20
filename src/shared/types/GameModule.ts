import type { ComponentType } from 'react'

/**
 * The contract every game plugs into the hub with. Adding a new game means
 * creating a sibling folder under `src/games/` and registering one of these
 * in `src/hub/GameRegistry.ts` — the hub shell never needs to change.
 */
export interface GameModule {
  id: string
  name: string
  description: string
  /** Route path this game mounts at, e.g. "/games/wild-cards" */
  route: string
  accentColor: string
  ThumbnailIcon: ComponentType
  Component: ComponentType
}
