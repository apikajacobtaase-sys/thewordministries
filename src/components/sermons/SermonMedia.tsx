import Link from "next/link";

type SermonMediaProps = {
  url: string;
  title: string;
  kind: "audio" | "video";
  thumbnail?: string | null;
  className?: string;
};

type EmbedResult = {
  provider: string;
  src: string;
  externalLabel: string;
};

function getEmbed(url: string): EmbedResult | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname;

    // YouTube: watch, Shorts, live, embed and youtu.be share links.
    if (
      ["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(host)
    ) {
      let id = parsed.searchParams.get("v");

      if (host === "youtu.be") {
        id = path.split("/").filter(Boolean)[0] ?? null;
      }

      if (!id) {
        const match = path.match(/^\/(?:shorts|live|embed|v)\/([a-zA-Z0-9_-]{11})/);
        id = match?.[1] ?? null;
      }

      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return {
          provider: "YouTube",
          src: `https://www.youtube-nocookie.com/embed/${id}`,
          externalLabel: "Watch on YouTube",
        };
      }
    }

    // Vimeo.
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = path.match(/\/(?:video\/)?(\d+)/);
      if (match?.[1]) {
        return {
          provider: "Vimeo",
          src: `https://player.vimeo.com/video/${match[1]}`,
          externalLabel: "Watch on Vimeo",
        };
      }
    }

    // TikTok public videos.
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const match = path.match(/\/@[^/]+\/video\/(\d+)/);
      if (match?.[1]) {
        return {
          provider: "TikTok",
          src: `https://www.tiktok.com/embed/v2/${match[1]}`,
          externalLabel: "Watch on TikTok",
        };
      }
    }

    // Facebook videos and Reels.
    if (host === "facebook.com" || host.endsWith(".facebook.com")) {
      const videoId =
        parsed.searchParams.get("v") ??
        path.match(/\/(?:videos|reel|watch)\/(\d+)/)?.[1];

      if (videoId || path.includes("/reel/") || path.includes("/videos/")) {
        return {
          provider: "Facebook",
          src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
          externalLabel: "Watch on Facebook",
        };
      }
    }

    // Instagram public posts and Reels.
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      const match = path.match(/^\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
      if (match?.[1]) {
        const type = path.split("/")[1];
        return {
          provider: "Instagram",
          src: `https://www.instagram.com/${type}/${match[1]}/embed`,
          externalLabel: "View on Instagram",
        };
      }
    }

    // X / Twitter posts.
    if (host === "x.com" || host === "twitter.com") {
      const match = path.match(/\/status\/(\d+)/);
      if (match?.[1]) {
        return {
          provider: "X",
          src: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`,
          externalLabel: "View post on X",
        };
      }
    }

    // SoundCloud audio tracks and playlists.
    if (kindIsAudioPath(path) && (host === "soundcloud.com" || host === "on.soundcloud.com")) {
      return {
        provider: "SoundCloud",
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%231877f2&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`,
        externalLabel: "Listen on SoundCloud",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function kindIsAudioPath(path: string) {
  return path.length > 1;
}

function getFileType(url: string): "audio" | "video" | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();

    if (/\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)$/.test(pathname)) {
      return "audio";
    }

    if (/\.(mp4|webm|ogv|mov|m4v)$/.test(pathname)) {
      return "video";
    }

    return null;
  } catch {
    return null;
  }
}

export default function SermonMedia({
  url,
  title,
  kind,
  thumbnail,
  className = "mt-8",
}: SermonMediaProps)  {
  const embed = getEmbed(url);
  const fileType = getFileType(url);

  const externalLink = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
    >
      {embed?.externalLabel ?? `Open ${kind === "audio" ? "audio" : "video"}`}
    </a>
  );

  if (fileType === "audio" || fileType === "video") {
    if (fileType === "audio") {
      return (
        <section className={className}>
          <h2 className="mb-3 text-lg font-bold text-[#1c1e21]">
            Listen to Sermon
          </h2>
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-4">
            <audio controls preload="metadata" className="w-full" src={url}>
              Your browser does not support audio playback.
            </audio>
          </div>
        </section>
      );
    }

    return (
      <section className={className}>
        <h2 className="mb-3 text-lg font-bold text-[#1c1e21]">
          Watch Sermon
        </h2>
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <video
            controls
            preload="metadata"
            poster={thumbnail ?? undefined}
            className="h-full w-full"
            src={url}
          >
            Your browser does not support video playback.
          </video>
        </div>
      </section>
    );
  }

  if (embed) {
    return (
      <section className={className}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1c1e21]">
            {kind === "audio" ? "Listen to Sermon" : "Watch Sermon"}
          </h2>
          <span className="text-xs font-medium text-[#65676b]">
            {embed.provider}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-black">
          <div className="aspect-video">
            <iframe
              src={embed.src}
              title={`${title} - ${embed.provider}`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        <div className="mt-3">{externalLink}</div>
      </section>
    );
  }

  return (
    <section className={className}>
      <h2 className="mb-3 text-lg font-bold text-[#1c1e21]">
        {kind === "audio" ? "Listen to Sermon" : "Watch Sermon"}
      </h2>
      <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5">
        <p className="mb-4 text-sm text-[#65676b]">
          This media is hosted on an external platform.
        </p>
        {externalLink}
      </div>
    </section>
  );
}


