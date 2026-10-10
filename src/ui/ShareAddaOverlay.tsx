import "@/ui/adda.css";
import { useEffect, useId, useMemo, useState } from "react";

import { useActions, useApp } from "@/app/context";
import type { AddaView } from "@/app/store";
import { canvasToBlob, drawAddaCard } from "@/ui/addaCard";
import {
  cardFaces,
  cardFileName,
  linkedInShareUrl,
  namesText,
  shareCaption,
  shareTitle,
  xIntentUrl,
} from "@/ui/addaShare";
import type { CardFace } from "@/ui/addaShare";
import { Glyph, Icon } from "@/ui/Icon";
import { CloseButton, Overlay } from "@/ui/Overlay";

interface Card {
  readonly file: File;
  readonly url: string;
}

/** Draws the card once per crew and look; frees the preview URL when it changes or closes. */
function useCard(faces: readonly CardFace[], adda: AddaView | null): Card | "failed" | null {
  const [card, setCard] = useState<Card | "failed" | null>(null);
  const look = adda?.look ?? null;
  useEffect(() => {
    if (!look || faces.length === 0) return undefined;
    let url: string | null = null;
    let cancelled = false;
    drawAddaCard(faces, look)
      .then(canvasToBlob)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setCard({ file: new File([blob], cardFileName(faces), { type: "image/png" }), url });
      })
      .catch(() => {
        if (!cancelled) setCard("failed");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [faces, look]);
  return card;
}

function download(card: Card): void {
  const a = document.createElement("a");
  a.href = card.url;
  a.download = card.file.name;
  a.click();
}

function canShareFiles(file: File): boolean {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * The faces on the card, as a value that only changes when the crew does: people arriving on
 * the map or points ticking up must not redraw the image.
 */
function useFaces(): CardFace[] {
  const key = useApp((s) =>
    s.you && s.adda ? JSON.stringify(cardFaces(s.you, s.adda, s.people)) : "[]",
  );
  return useMemo(() => JSON.parse(key) as CardFace[], [key]);
}

function ShareButtons({
  card,
  faces,
}: {
  readonly card: Card;
  readonly faces: readonly CardFace[];
}) {
  const actions = useActions();
  const caption = shareCaption(faces);
  const native = canShareFiles(card.file);
  const toast = (text: string): void => actions.pushToast(text, "circus_tent", "success");
  const shareNative = (): void => {
    navigator
      .share({ files: [card.file], title: shareTitle(faces), text: caption })
      .catch(() => undefined);
  };
  // X and LinkedIn can't take an image from a link, so the picture is saved to attach by hand.
  const postTo = async (url: string, site: string): Promise<void> => {
    download(card);
    const copied = await copy(caption);
    window.open(url, "_blank", "noopener,noreferrer");
    toast(`Image saved${copied ? " and caption copied" : ""}. Attach it to your ${site} post.`);
  };
  return (
    <div className="share-actions">
      {native ? (
        <button type="button" className="btn btn--wave btn--big" onClick={shareNative}>
          <Icon id="circus_tent" size={24} />
          Share image
        </button>
      ) : null}
      <div className="share-actions__row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void postTo(xIntentUrl(caption), "X")}
        >
          Post on X
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => void postTo(linkedInShareUrl(), "LinkedIn")}
        >
          Post on LinkedIn
        </button>
      </div>
      <div className="share-actions__row">
        <button type="button" className="btn btn--secondary" onClick={() => download(card)}>
          Download image
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => void copy(caption).then((ok) => ok && toast("Caption copied."))}
        >
          Copy caption
        </button>
      </div>
    </div>
  );
}

function CardPreview({
  card,
  faces,
}: {
  readonly card: Card | "failed" | null;
  readonly faces: readonly CardFace[];
}) {
  if (card === "failed") {
    return <p className="empty-note">This browser couldn't draw the image. Try another browser.</p>;
  }
  if (!card) {
    return (
      <p className="share-card share-card--loading" role="status">
        Drawing your adda…
      </p>
    );
  }
  const names = namesText(faces.map((f) => f.name));
  return <img className="share-card" src={card.url} alt={`${shareTitle(faces)}: ${names}`} />;
}

/** "Share my adda": a picture of your crew's faces and names, ready for X, LinkedIn or anywhere. */
export function ShareAddaOverlay({
  leaving,
  onClose,
}: {
  readonly leaving: boolean;
  readonly onClose: () => void;
}) {
  const titleId = useId();
  const adda = useApp((s) => s.adda);
  const faces = useFaces();
  const card = useCard(faces, adda);
  return (
    <Overlay kind="share" labelledBy={titleId} leaving={leaving} onClose={onClose}>
      <div className="overlay__scroll share">
        <header className="share__head">
          <CloseButton onClose={onClose} />
          <h2 id={titleId} className="share__title">
            Share your adda
          </h2>
          <p className="share__hint">
            <Glyph name="check" size={16} />
            Only you and people who said yes are in the picture, with their names. No handles.
          </p>
        </header>
        <CardPreview card={card} faces={faces} />
        {card && card !== "failed" ? <ShareButtons card={card} faces={faces} /> : null}
      </div>
    </Overlay>
  );
}
