/**
 * Avatar Utilities & Preset Gallery
 * Provides curated avatar options and avatar generator helpers.
 */

export interface AvatarPreset {
  id: string;
  name: string;
  category: "Leadership" | "Developer" | "Client" | "Creative" | "3D Style";
  url: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: "preset-leader-1",
    name: "Executive Leader",
    category: "Leadership",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
  },
  {
    id: "preset-leader-2",
    name: "Manager Pro",
    category: "Leadership",
    url: "https://api.dicebear.com/7.x/personas/svg?seed=Manager",
  },
  {
    id: "preset-dev-1",
    name: "Tech Engineer",
    category: "Developer",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander",
  },
  {
    id: "preset-dev-2",
    name: "Fullstack Dev",
    category: "Developer",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Sophia",
  },
  {
    id: "preset-client-1",
    name: "Corporate Partner",
    category: "Client",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Victoria",
  },
  {
    id: "preset-client-2",
    name: "Enterprise Client",
    category: "Client",
    url: "https://api.dicebear.com/7.x/micah/svg?seed=Enterprise",
  },
  {
    id: "preset-creative-1",
    name: "Design Lead",
    category: "Creative",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Designer",
  },
  {
    id: "preset-3d-1",
    name: "3D Persona",
    category: "3D Style",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=TaskConnect",
  },
];

/**
 * Generate default fallback avatar URL for a given email or name
 */
export function getDefaultAvatar(identifier: string): string {
  const seed = encodeURIComponent(identifier || "User");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}
