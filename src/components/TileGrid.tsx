import Image from "next/image";
import Link from "next/link";

export type Tile = {
  title: string;
  description?: string;
  image?: string;
  href?: string; // only set when the tile should link somewhere
};

// 4:3 image box, steel-grey when there's no photo. With a title, it's overlaid bottom-left as an h2.
// Plain rgba gradient (not Tailwind's gradient utilities) so it renders on older iOS Safari.
export function ImageBox({ title, image }: { title?: string; image?: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-600">
      {image && <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />}
      {title && (
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),rgba(0,0,0,0))] px-4 pb-3 pt-12">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      )}
    </div>
  );
}

export default function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => {
        const content = (
          <>
            <ImageBox title={tile.title} image={tile.image} />
            {tile.description && <p className="text-gray-600 text-sm mt-3">{tile.description}</p>}
          </>
        );
        return (
          <li key={tile.title}>
            {tile.href ? (
              <Link
                href={tile.href}
                className="block h-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
              >
                {content}
              </Link>
            ) : (
              <div className="h-full">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
