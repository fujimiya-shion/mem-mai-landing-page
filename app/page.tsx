import MemMaiDraw from "@/components/MemMaiDraw";

export default function Page() {
  return (
    <main className="mm-stage-root">
      <div className="mm-bg">
        <div className="mm-haze" />
        <div className="mm-bloom" />
      </div>

      <div className="mm-content">
        <MemMaiDraw width="100%" height="55vh" />
      </div>
    </main>

  );
}
