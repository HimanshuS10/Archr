export default function DemoVideo() {
  return (
    <section className="relative px-6 pb-24">
      <div className="relative mx-auto w-full max-w-5xl ">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-blue-500/20">
          <div className="relative overflow-hidden rounded-2xl bg-black/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_50%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-white text-2xl">Coming Soon....</h1>
            </div>
            <div className="aspect-video w-full">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster="/demo-poster.jpg"
              >
                <source src="/demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-white/60">
          Live demo preview of how Archr auto-optimizes your schedule.
        </p>
      </div>
    </section>
  );
}
