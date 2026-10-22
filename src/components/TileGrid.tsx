import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

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
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-steel">
      {image && <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />}
      {title && (
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),rgba(0,0,0,0))] px-4 pb-3 pt-12">
          <h2 className="tile-text text-lg font-semibold text-white">{title}</h2>
        </div>
      )}
    </div>
  );
}

export default function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => {
        const content = (
          <>
            <ImageBox title={tile.title} image={tile.image} />
            {tile.description && (
              <div className="tile-desc mt-4">
                <p className="tile-text text-muted">{tile.description}</p>
              </div>
            )}
          </>
        );
        return (
          <Reveal as="li" key={tile.title}>
            {tile.href ? (
              <Link
                href={tile.href}
                className="tile block h-full rounded-lg"
              >
                {content}
              </Link>
            ) : (
              <div className="tile h-full">{content}</div>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}
