/**
 * Pure TypeScript Multiplayer Protocol & Shared World Contracts (Phase 1.5+).
 * Zero browser, React, or Three.js dependencies so both Frontend Client and
 * Authoritative Node.js/Colyseus Realtime Server share the exact same schema.
 */

export const WORLD_MAX_PLAYERS_MVP = 10;
export const SERVER_TICK_HZ = 15;
export const CLIENT_INPUT_SEND_HZ = 15;

export type WorldZoneId = 'hilltop' | 'lakeside' | 'observatory' | 'garden';

export type AvatarArchetype = 'seeker' | 'chronicler';

export type SocialEmote = 'wave' | 'point' | 'sit';

export type PlayerPose =
  | 'idle'
  | 'lookUp'
  | 'walk'
  | 'sit'
  | 'discover'
  | 'gift'
  | 'wave'
  | 'point';

export type WorldMemberRole = 'owner' | 'visitor';

export type ConnectionMode = 'offline' | 'connecting' | 'connected' | 'reconnecting';

export interface GuestIdentity {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarType: AvatarArchetype;
  readonly isAnonymous: boolean;
}

export interface WorldMetadata {
  readonly worldId: string;
  readonly title: string;
  readonly ownerPlayerId: string;
  readonly allowVisitorCreateStars: boolean;
  readonly maxPlayers: number;
}

export interface NetworkPlayerSnapshot {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarType: AvatarArchetype;
  readonly memberRole: WorldMemberRole;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotY: number;
  readonly speed: number;
  readonly pose: PlayerPose;
  readonly serverTimeMs: number;
}

export interface SyncedMeteorEvent {
  readonly eventId: string;
  readonly type: 'meteor_shower';
  readonly seed: string;
  readonly count: number;
  readonly mode: 'in-view' | 'distant-horizon' | 'random-sky';
  readonly triggeredByPlayerId: string;
  readonly triggeredByName: string;
  readonly serverTimeMs: number;
}

export type ClientToServerMessage =
  | {
      readonly type: 'player_input';
      readonly seq: number;
      readonly dirX: number;
      readonly dirZ: number;
      readonly dtMs: number;
    }
  | {
      readonly type: 'player_emote';
      readonly emote: SocialEmote;
    }
  | {
      readonly type: 'teleport_zone';
      readonly zoneId: WorldZoneId;
    }
  | {
      readonly type: 'trigger_meteor_shower';
      readonly count: number;
      readonly mode: 'in-view' | 'distant-horizon' | 'random-sky';
    };

export type ServerToClientMessage =
  | {
      readonly type: 'players_patch';
      readonly serverTimeMs: number;
      readonly players: readonly NetworkPlayerSnapshot[];
      readonly ackSeqByPlayer?: Readonly<Record<string, number>>;
    }
  | {
      readonly type: 'player_joined';
      readonly player: NetworkPlayerSnapshot;
    }
  | {
      readonly type: 'player_left';
      readonly playerId: string;
    }
  | {
      readonly type: 'world_event';
      readonly event: SyncedMeteorEvent;
    };
