"use client";

export default function Hero() {
  return (
    <section className="w-full bg-white pt-28 pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <h1 className="text-3xl leading-[1.05] font-medium tracking-tight text-black md:text-[57px]">
            Plan Smarter,
            <br />
            Own Your Week
          </h1>

          <div className="lg:pt-3 ">
            <div className="text-left">
              <p className="text-[17px] text-left font-semibold tracking-tighter leading-relaxed text-black/60">
                Archr helps you auto-plan tasks around your real schedule, so
                you always know what to do next.
              </p>
            </div>
            <div className="mt-6 flex justify-start">
              <a
                href="#"
                className="inline-flex items-center rounded-full bg-linear-to-b from-blue-400 via-blue-500 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 ring-1 ring-inset ring-white/20 transition hover:from-blue-300 hover:via-blue-400 hover:to-blue-500"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-linear-to-b from-white to-[#ececec] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] md:p-12">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[220px_1fr_220px] md:items-center">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-xs text-black/40">This week</p>
              <p className="mt-2 text-2xl font-semibold text-black">18 tasks</p>
              <div className="mt-4 h-2 rounded-full bg-black/10">
                <div className="h-2 w-2/3 rounded-full bg-blue-500" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-black/60">Today</p>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Focus mode
                </span>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-[#f4f6fb] px-4 py-3 text-sm text-black/80">
                  09:00 - Deep work: Math assignment
                </div>
                <div className="rounded-xl bg-[#f4f6fb] px-4 py-3 text-sm text-black/80">
                  11:30 - Team sync
                </div>
                <div className="rounded-xl bg-[#f4f6fb] px-4 py-3 text-sm text-black/80">
                  15:00 - Project review
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-xs text-black/40">AI insight</p>
              <p className="mt-2 text-base font-medium text-black">
                Move writing block to 7:30 PM for better focus.
              </p>
              <button className="mt-4 w-full rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm text-black/70 transition hover:bg-black/10">
                Apply suggestion
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
