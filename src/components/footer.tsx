export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line2 bg-page/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1152px] flex-col items-center justify-between gap-5 px-4 py-6 sm:px-6 md:flex-row md:items-end">
        {/* Poetic line */}
        <div className="flex flex-col items-center md:items-start">
          <p lang="ur" dir="rtl" className="font-reem text-sm text-muted">
            زندگی بھی کہیں ملتی ہے فنا سے پہلے۔
          </p>
        </div>

        {/* Signature */}
        <div className="flex flex-col items-center md:items-end md:text-right">
          <p lang="ur" dir="rtl" className="font-ruqaa text-2xl signature-ink">
            فیروز خان چوہان
          </p>
        </div>
      </div>
    </footer>
  );
}