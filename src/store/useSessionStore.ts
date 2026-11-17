import { create } from 'zustand';
import {
  WORLD_MAX_PLAYERS_MVP,
  type ConnectionMode,
  type GuestIdentity,
  type NetworkPlayerSnapshot,
  type WorldMemberRole,
  type WorldMetadata,
} from '../shared/protocol';
import { OFFLINE_SEEKER_ID } from '../services/playerRuntime';

interface SessionState {
  connectionMode: ConnectionMode;
  worldMeta: WorldMetadata;
  localGuest: GuestIdentity;
  memberRole: WorldMemberRole;
  remotePlayers: NetworkPlayerSnapshot[];
  hiddenPlayerIds: string[];

  setConnectionMode: (mode: ConnectionMode) => void;
  setWorldMeta: (meta: WorldMetadata) => void;
  setLocalGuest: (guest: GuestIdentity) => void;
  setMemberRole: (role: WorldMemberRole) => void;
  setRemotePlayers: (players: NetworkPlayerSnapshot[]) => void;
  toggleHidePlayer: (playerId: string) => void;
}

/**
 * Transient Multiplayer & World Session Store (Phase 1.5+).
 * Runs cleanly in `'offline'` mode during local/single-player play and is ready to be
 * hydrated by Supabase Guest Auth + Node/Colyseus Realtime Server in Phases 2 & 3.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  connectionMode: 'offline',
  worldMeta: {
    worldId: 'local-default-world',
    title: 'A Sky Full of You',
    ownerPlayerId: OFFLINE_SEEKER_ID,
    allowVisitorCreateStars: true,
    maxPlayers: WORLD_MAX_PLAYERS_MVP,
  },
  localGuest: {
    playerId: OFFLINE_SEEKER_ID,
    displayName: 'Người tìm sao',
    avatarType: 'seeker',
    isAnonymous: true,
  },
  memberRole: 'owner',
  remotePlayers: [],
  hiddenPlayerIds: [],

  setConnectionMode: (connectionMode) => set({ connectionMode }),
  setWorldMeta: (worldMeta) => set({ worldMeta }),
  setLocalGuest: (localGuest) => set({ localGuest }),
  setMemberRole: (memberRole) => set({ memberRole }),
  setRemotePlayers: (remotePlayers) => set({ remotePlayers }),

  toggleHidePlayer: (playerId) =>
    set((state) => ({
      hiddenPlayerIds: state.hiddenPlayerIds.includes(playerId)
        ? state.hiddenPlayerIds.filter((id) => id !== playerId)
        : [...state.hiddenPlayerIds, playerId],
    })),
}));
