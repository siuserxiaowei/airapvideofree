/**
 * SITE: AIRapVideoFree 站点配置
 */

/** 首页工作台默认打开的工具 */
export const HOME_TOOL = 'ai-rap-video';

/** 首页工作台能切换的工具与热词特效 */
export const HOME_TOOLS = [
  'ai-rap-video',
  'hotel-lobby-rap',
  'drill-rap',
  'cyberpunk-rap',
  'boom-bap-rap',
];

/** 首页作品墙 */
export interface ShowcaseItem {
  src: string;
  kind: 'image' | 'video';
  poster?: string;
  model: string;
  toolId?: string;
  prompt?: string;
}

export const SHOWCASE: ShowcaseItem[] = [
  {
    src: '/samples/rap-demo.mp4',
    kind: 'video',
    model: 'Kling 2.5 Turbo',
    toolId: 'ai-rap-video',
    prompt: 'Rapper spitting aggressive bars with authentic head nodding, holding a mic, 9:16 vertical video',
  },
  {
    src: '/samples/mock-video.mp4',
    kind: 'video',
    model: 'Hailuo 2.3 Fast',
    toolId: 'hotel-lobby-rap',
    prompt: 'Colors Show orange studio booth rap video with gold chains and authentic swagger',
  },
];
