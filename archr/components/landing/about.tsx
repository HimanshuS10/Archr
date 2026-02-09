export default function About() {
  return (
    <section
      id="about"
      className="relative z-10 px-6 pb-24 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#060b1a] to-transparent" />
        <div className="absolute left-1/2 top-10 h-64 w-200 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          About Archr
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Your schedule adapts before you even notice.
        </h2>
        <p className="mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
          Archr turns your course outlines into a living plan. When lectures
          move, meetings cancel, or deadlines shift, we automatically rebuild
          your week so you always know what to work on next.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white">Smart parsing</h3>
            <p className="mt-3 text-sm text-white/70">
              Upload a syllabus and we extract assignments, exams, and due
              dates automatically.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white">Auto planning</h3>
            <p className="mt-3 text-sm text-white/70">
              We generate study blocks around your real calendar so you stay
              on track without manual planning.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white">Always updated</h3>
            <p className="mt-3 text-sm text-white/70">
              When a class gets canceled, Archr instantly re-optimizes your
              schedule with the next best task.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
