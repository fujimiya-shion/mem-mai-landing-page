import MemMaiDraw from "@/components/MemMaiDraw";

export default function Page() {
  return (
    <div className="mm-stage-root">
      <div className="mm-bg">
        <div className="mm-bgImg" />
        <div className="mm-bgOverlay" />
      </div>

      <div className="mm-content">
        <MemMaiDraw/>
      </div>
    </div>
  );
}
