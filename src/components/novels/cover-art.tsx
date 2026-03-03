type CoverArtProps = {
  title: string;
  tagline: string;
  genre: string;
  coverTone: string;
  coverImageUrl?: string;
  className?: string;
  titleClassName?: string;
  taglineClassName?: string;
};

export function CoverArt({
  title,
  tagline,
  genre,
  coverTone,
  coverImageUrl,
  className = "",
  titleClassName = "",
  taglineClassName = "",
}: CoverArtProps) {
  if (coverImageUrl) {
    return (
      <div className={`cover-card relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          alt={`Sampul ${title}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-6 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-white/72">{genre}</p>
          <h3 className={`mt-3 font-semibold leading-tight ${titleClassName}`}>{title}</h3>
          <p className={`mt-3 max-w-[15rem] leading-6 text-white/84 ${taglineClassName}`}>{tagline}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cover-card bg-gradient-to-br ${coverTone} text-white ${className}`}>
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-white/70">{genre}</p>
        <h3 className={`mt-10 font-semibold leading-tight ${titleClassName}`}>{title}</h3>
        <p className={`mt-3 max-w-[15rem] leading-6 text-white/84 ${taglineClassName}`}>{tagline}</p>
      </div>
    </div>
  );
}
