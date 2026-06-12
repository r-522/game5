// 枠付き横ゲージの共通部品（平和度・男気・制限時間タイマーで使用）。
// ratio は 0..1。範囲外はクランプして塗り幅に変換する。
export function Meter({
  ratio,
  fill,
  className = "",
}: {
  ratio: number;
  fill: string;
  className?: string;
}) {
  const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`h-full ${fill}`} style={{ width }} />
    </div>
  );
}
