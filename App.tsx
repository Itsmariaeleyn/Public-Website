import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { projectId, publicAnonKey } from "./utils/supabase/info";

const galleryApi = `https://${projectId}.supabase.co/functions/v1/make-server-424cfffc`;

const PROFILE_IMAGE = "";
const COVER_IMAGE =
  "https://images.unsplash.com/photo-1777731476530-bd4e64645d16?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&q=85&w=1400";

const getCachedImage = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const cacheImage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The cloud image still works when browser storage is unavailable.
  }
};

const things = [
  {
    name: "PRJ - ThriftLoop",
    detail: "Curated Online Thrift Shop . 2026",
  },
  {
    name: "PRJ - CLINIQ",
    detail: "Online Clinic Booking System . 2026",
  },
  {
    name: "Org -NUD Student Government",
    detail: " AudioVisual Member. 2025",
  },
  {
    name: "Org - NUD Symphony",
    detail: "Executive Secretary. 2026",
  },
  {
    name: "Org - NUD Symphony",
    detail: "Secretariant Committee. 2025 - 2026",
  },
  {
    name: "Org - NUD Sigma Esports",
    detail: " OSEC - Records & Archives. 2026",
  },
   {
    name: "Org - NUD Sigma Esports",
    detail: " Event Committee. 2025 - 2026",
  },
   {
    name: "Org - NUD Sigma Esports",
    detail: " Logistics Committee. 2024 - 2025",
  },
  {
    name: "Org - NUD Comsoc",
    detail: " AudioVisual Coordinator. 2024 - 2025",
  },
];

type GalleryPhoto = {
  id?: string;
  src: string;
  alt: string;
  caption: string;
};

type ImageCropModalProps = {
  file: File;
  aspectRatio: number;
  title: string;
  allowFit?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

function ImageCropModal({
  file,
  aspectRatio,
  title,
  allowFit = false,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [frameMode, setFrameMode] = useState<"fill" | "fit">("fill");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const createCrop = async () => {
    setIsProcessing(true);
    try {
      const image = new Image();
      image.src = previewUrl;
      await image.decode();

      const width = aspectRatio === 1 ? 900 : 1600;
      const height = Math.round(width / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image preview is unavailable.");

      const baseScale = frameMode === "fit"
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const scale = baseScale * zoom;
      const scaledWidth = image.naturalWidth * scale;
      const scaledHeight = image.naturalHeight * scale;
      const offsetX = -(scaledWidth - width) * (positionX / 100);
      const offsetY = -(scaledHeight - height) * (positionY / 100);
      context.fillStyle = "#2b456b";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error("Unable to crop image.")),
          "image/jpeg",
          .9,
        );
      });
      onConfirm(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-cropped.jpg`, {
        type: "image/jpeg",
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="crop-modal-backdrop">
      <section className="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="crop-heading">
          <div>
            <span className="overline">Image preview</span>
            <h2 id="crop-title">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close image preview">×</button>
        </div>
        <div
          className="crop-preview"
          style={{
            aspectRatio,
            maxWidth: aspectRatio === 1 ? "24rem" : aspectRatio < 2 ? "32rem" : "100%",
          }}
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Upload preview"
              style={{
                objectPosition: `${positionX}% ${positionY}%`,
                objectFit: frameMode === "fit" ? "contain" : "cover",
                transform: `scale(${zoom})`,
                transformOrigin: `${positionX}% ${positionY}%`,
              }}
            />
          )}
        </div>
        {allowFit && (
          <div className="frame-mode" aria-label="Photo frame style">
            <button
              className={frameMode === "fill" ? "active" : ""}
              type="button"
              onClick={() => {
                setFrameMode("fill");
                setZoom(1);
              }}
            >
              Fill frame
            </button>
            <button
              className={frameMode === "fit" ? "active" : ""}
              type="button"
              onClick={() => {
                setFrameMode("fit");
                setZoom(1);
              }}
            >
              Fit to frame
            </button>
          </div>
        )}
        <div className="crop-controls">
          <label>
            <span>Horizontal position</span>
            <input
              type="range"
              min="0"
              max="100"
              value={positionX}
              onChange={(event) => setPositionX(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Vertical position</span>
            <input
              type="range"
              min="0"
              max="100"
              value={positionY}
              onChange={(event) => setPositionY(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Zoom</span>
            <input
              type="range"
              min="1"
              max="2"
              step=".05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="crop-actions">
          <button type="button" className="crop-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={createCrop} disabled={isProcessing}>
            {isProcessing ? "Preparing..." : "Use this crop"}
          </button>
        </div>
      </section>
    </div>
  );
}

const tabs = ["Overview", "Gaming", "Portfolio", "Gallery", "About"];

const StarIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="m12 2.8 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.8Z" />
  </svg>
);

const SunIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" />
  </svg>
);

const AcademicIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="m3 8.5 9-4 9 4-9 4-9-4Z" />
    <path d="M6.5 10.2v5.1c2.9 2.3 8.1 2.3 11 0v-5.1M21 9v6" />
  </svg>
);

const CivicIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 20h16M5.5 17h13M7 17V9m5 8V9m5 8V9M4 7h16L12 3 4 7Z" />
  </svg>
);

function OverviewPanel() {
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <span className="overline">Public Profile</span>
          <h2>Welcome to my space</h2>
        </div>
        <span className="online-pill"><i /> Reach me freely with purpose</span>
      </div>
      <p className="profile-summary">
        Hey there! I&apos;m Ria — current 3rd year IT Student at NU Dasma. I play to compete,
        connect, and have fun, while building and exploring digital experiences that make communities more useful,
        welcoming, and fun.
      </p>
      <div className="cv-columns">
        <div>
          <span className="overline">Find me online</span>
          <a href="#profile">@mariangeleyn_ · Discord</a>
          <a href="mailto:maellainebejerano@gmail.com">maellainebejerano@gmail.com</a>
        </div>
        <div>
          <span className="overline">Profile details</span>
          <span>Main roles: Controller / Initiator / Sentinel</span>
          <span>Region: Southeast Asia</span>
          <span>Languages: Filipino / English</span>
        </div>
      </div>
      <div className="game-row">
        <div>
          <span className="overline">Current status</span>
          <strong>Exploring and balancing everything</strong>
        </div>
        <span className="rank-badge">AVAILABLE 2026</span>
      </div>
    </section>
  );
}

function GamingPanel() {
  const roles = [
    {
      date: "Game 01",
      role: "Valorant",
      company: "Peak: Asc 1 · Controller / Initiator",
      details: "Laro lang until mapikon XD",
    },
    {
      date: "Game 02",
      role: "Roblox",
      company: "Pang alis umay",
      details: "Makipag away sa bata LOL",
    },
  ];

  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div><span className="overline">Games & play style</span><h2>Gaming profile</h2></div>
        <span className="panel-icon"><CivicIcon /></span>
      </div>
      <div className="timeline">
        {roles.map((item) => (
          <article className="timeline-item" key={item.role}>
            <span className="timeline-date">{item.date}</span>
            <div>
              <h3>{item.role}</h3>
              <strong>{item.company}</strong>
              <p>{item.details}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutPanel() {
  const groups = [
    ["01", "In Game", ["Yapper", "Tilted", "Play for fun",]],
    ["02", "At Org", ["Facilitator", "Event organizer", "Alto Singer", "Records & Archives", "Executive Secretary",]],
    ["03", "Off Screen", ["IT Student", "Sleeper", "Matcha",]],
    ["04", "At University", ["Hungry", "Tired", "Wala akong choice lagi",]],
  ] as const;

  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div><span className="overline">The person behind the tag</span><h2>About me</h2></div>
        <span className="panel-icon"><AcademicIcon /></span>
      </div>
      <div className="skill-groups">
        {groups.map(([number, title, skills]) => (
          <article key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <div className="skill-tags">
                {skills.map((skill) => <b key={skill}>{skill}</b>)}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioPanel() {
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div><span className="overline">Side Quest</span><h2>Things I did from the past</h2></div>
        <span className="rank-badge">Past Projects?Org histories?</span>
      </div>
      <div className="timeline">
        {projects.map((item, index) => (
          <article className="timeline-item" key={item.name}>
            <span className="timeline-date">PROJECT {String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{item.name}</h3>
              <strong>{item.detail}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type GalleryPanelProps = {
  ownerPassword: string | null;
  isOwner: boolean;
};

function GalleryPanel({ ownerPassword, isOwner }: GalleryPanelProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<GalleryPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropCandidate, setCropCandidate] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const response = await fetch(`${galleryApi}/gallery`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });
        if (!response.ok) throw new Error("Unable to load gallery.");
        const data = await response.json();
        setUploadedPhotos(data.photos ?? []);
      } catch {
        setMessage("Cloud photos are temporarily unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, []);

  const uploadPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !ownerPassword) return;

    const form = event.currentTarget;
    setIsUploading(true);
    setMessage("Uploading photo...");
    const formData = new FormData();
    formData.append("photo", selectedFile);
    formData.append("caption", caption);

    try {
      const response = await fetch(`${galleryApi}/gallery/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Owner-Password": ownerPassword,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");

      setUploadedPhotos((current) => [data.photo, ...current]);
      setSelectedFile(null);
      setCaption("");
      setMessage("Photo uploaded. It is now visible to everyone.");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async (photo: GalleryPhoto) => {
    if (!photo.id || !ownerPassword || !window.confirm("Remove this photo from the gallery?")) return;

    const response = await fetch(`${galleryApi}/gallery/${photo.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "X-Owner-Password": ownerPassword,
      },
    });
    if (response.ok) {
      setUploadedPhotos((current) => current.filter((item) => item.id !== photo.id));
      setMessage("Photo removed.");
    } else {
      const data = await response.json();
      setMessage(data.error ?? "The photo could not be removed.");
    }
  };

  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <span className="overline">Moments & memories</span>
          <h2>Mini gallery</h2>
        </div>
        <span className="rank-badge">{uploadedPhotos.length.toString().padStart(2, "0")} PHOTOS</span>
      </div>
      <p className="gallery-intro">
        A few snapshots from games, community events, projects, and everything in between.
      </p>
      {ownerPassword && isOwner && (
        <details className="gallery-admin">
          <summary>Add photos</summary>
          <form className="gallery-upload-form" onSubmit={uploadPhoto}>
            <label className="file-picker">
              <span>{selectedFile ? selectedFile.name : "Choose a photo"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setCropCandidate(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
            <input
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Add a short caption"
              maxLength={80}
            />
            <button type="submit" disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload photo"}
            </button>
          </form>
          {message && <p className="gallery-message" role="status">{message}</p>}
        </details>
      )}
      {!isOwner && message && <p className="gallery-loading" role="status">{message}</p>}
      {isLoading && <p className="gallery-loading">Loading shared photos...</p>}
      {!isLoading && uploadedPhotos.length === 0 && (
        <p className="gallery-empty">No moments added yet. Check back soon.</p>
      )}
      <div className="gallery-grid">
        {uploadedPhotos.map((photo) => (
          <figure key={photo.id ?? photo.src}>
            <img src={photo.src} alt={photo.alt} loading="lazy" />
            <figcaption>{photo.caption}</figcaption>
            {isOwner && photo.id && (
              <button
                className="gallery-remove"
                type="button"
                onClick={() => removePhoto(photo)}
                aria-label={`Remove ${photo.caption}`}
              >
                Remove
              </button>
            )}
          </figure>
        ))}
      </div>
      {cropCandidate && (
        <ImageCropModal
          file={cropCandidate}
          aspectRatio={4 / 3}
          title="Adjust gallery photo"
          allowFit
          onCancel={() => setCropCandidate(null)}
          onConfirm={(file) => {
            setSelectedFile(file);
            setCropCandidate(null);
          }}
        />
      )}
    </section>
  );
}

export default function App() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [ownerPassword, setOwnerPassword] = useState<string | null>(() => {
    return sessionStorage.getItem("profile-owner-password");
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [avatarImage, setAvatarImage] = useState(() =>
    getCachedImage("profile-avatar-url", PROFILE_IMAGE)
  );
  const [profileMediaLoading, setProfileMediaLoading] = useState(true);
  const [avatarStatus, setAvatarStatus] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [mediaCrop, setMediaCrop] = useState<{ file: File; kind: "avatar" | "cover" } | null>(null);
  const [coverImage, setCoverImage] = useState(() =>
    getCachedImage("profile-cover-url", COVER_IMAGE)
  );
  const [coverStatus, setCoverStatus] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("profile-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("profile-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    let isActive = true;

    const verifySavedPassword = async () => {
      if (!ownerPassword) return;
      try {
        const response = await fetch(`${galleryApi}/gallery/owner`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-Owner-Password": ownerPassword,
          },
        });
        if (isActive) setIsOwner(response.ok);
      } catch {
        if (isActive) setIsOwner(false);
      }
    };

    fetch(`${galleryApi}/profile-media`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (!isActive) return;
        if (data.media?.avatarUrl) {
          setAvatarImage(data.media.avatarUrl);
          cacheImage("profile-avatar-url", data.media.avatarUrl);
        }
        if (data.media?.coverUrl) {
          setCoverImage(data.media.coverUrl);
          cacheImage("profile-cover-url", data.media.coverUrl);
        }
      })
      .catch(() => {
        // Keep the default cover when cloud media is unavailable.
      })
      .finally(() => {
        if (isActive) setProfileMediaLoading(false);
      });

    verifySavedPassword();

    return () => {
      isActive = false;
    };
  }, [ownerPassword]);

  const unlockOwnerControls = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAvatarStatus("Checking password...");
    try {
      const response = await fetch(`${galleryApi}/gallery/owner`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Owner-Password": passwordInput,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Incorrect owner password.");

      const normalizedPassword = passwordInput.trim();
      sessionStorage.setItem("profile-owner-password", normalizedPassword);
      setOwnerPassword(normalizedPassword);
      setIsOwner(true);
      setPasswordInput("");
      setAvatarStatus("");
      setShowOwnerLogin(false);
    } catch (error) {
      setAvatarStatus(error instanceof Error ? error.message : "Unable to unlock owner controls.");
    }
  };

  const updateAvatar = async (file: File) => {
    if (!ownerPassword || !isOwner) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarStatus("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus("Profile images must be 5 MB or smaller.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarStatus("Uploading profile picture...");
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(`${galleryApi}/profile-media/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Owner-Password": ownerPassword,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Profile update failed.");

      setAvatarImage(data.media.avatarUrl);
      cacheImage("profile-avatar-url", data.media.avatarUrl);
      setAvatarStatus("Profile picture updated for all visitors.");
    } catch (error) {
      setAvatarStatus(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const updateCover = async (file: File) => {
    if (!ownerPassword || !isOwner) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverStatus("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverStatus("Cover images must be 5 MB or smaller.");
      return;
    }

    setIsUploadingCover(true);
    setCoverStatus("Uploading cover...");
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(`${galleryApi}/profile-media/cover`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Owner-Password": ownerPassword,
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Cover update failed.");

      setCoverImage(data.media.coverUrl);
      cacheImage("profile-cover-url", data.media.coverUrl);
      setCoverStatus("Cover updated for all visitors.");
    } catch (error) {
      setCoverStatus(error instanceof Error ? error.message : "Cover update failed.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const moveCursorGlow = (event: PointerEvent<HTMLDivElement>) => {
    shellRef.current?.style.setProperty("--cursor-x", `${event.clientX}px`);
    shellRef.current?.style.setProperty("--cursor-y", `${event.clientY}px`);
    shellRef.current?.style.setProperty("--cursor-glow-opacity", "1");
  };

  return (
    <div
      className="site-shell"
      data-theme={theme}
      ref={shellRef}
      onPointerMove={moveCursorGlow}
      onPointerLeave={() => shellRef.current?.style.setProperty("--cursor-glow-opacity", "0")}
    >
      <div className="cursor-glow" aria-hidden="true" />
      <button
        className="theme-toggle"
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <main className="profile-wrap" id="profile">
        <article className="profile-card">
          <div className="cover">
            <img src={coverImage} alt="Ria Ellaine profile cover" />
            {isOwner && (
              <div className="cover-owner-tools">
                <label className={isUploadingCover ? "is-uploading" : ""}>
                  {isUploadingCover ? "Uploading..." : "Update cover"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) setMediaCrop({ file, kind: "cover" });
                    }}
                    disabled={isUploadingCover}
                  />
                </label>
                {coverStatus && <span role="status">{coverStatus}</span>}
              </div>
            )}
          </div>

          <div className="identity">
            <div className="avatar-shell">
              {avatarImage ? (
                <img className="avatar" src={avatarImage} alt="Portrait of Ria Ellaine" />
              ) : profileMediaLoading ? (
                <div className="avatar avatar-loading" aria-label="Loading profile picture" />
              ) : (
                <div className="avatar avatar-placeholder" aria-label="No profile picture uploaded">
                  R
                </div>
              )}
              {isOwner && (
                <label className={isUploadingAvatar ? "avatar-edit is-uploading" : "avatar-edit"}>
                  {isUploadingAvatar ? "Uploading..." : "Update photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) setMediaCrop({ file, kind: "avatar" });
                    }}
                    disabled={isUploadingAvatar}
                  />
                </label>
              )}
            </div>
            <div className="identity-copy">
              <div className="name-line"><h1> Maria / RIA </h1></div>
              <p className="location"><span>🇵🇭</span> Cavite, Philippines</p>
              <p className="bio"> Player · Introvert · Explorer</p>
              {isOwner && avatarStatus && <p className="avatar-status" role="status">{avatarStatus}</p>}
            </div>
          </div>

          <nav className="tabs" aria-label="Public profile sections">
            {tabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="tab-content">
            {activeTab === "Overview" && <OverviewPanel />}
            {activeTab === "Gaming" && <GamingPanel />}
            {activeTab === "Portfolio" && <PortfolioPanel />}
            {activeTab === "Gallery" && (
              <GalleryPanel ownerPassword={ownerPassword} isOwner={isOwner} />
            )}
            {activeTab === "About" && <AboutPanel />}
          </div>
        </article>

        <footer>
          <span>Ria Ellaine · Public Profile</span>
          <span>
            For inquiries, contact me at{" "}
            <a href="mailto:maellainebejerano@gmail.com">maellainebejerano@gmail.com</a>
          </span>
          <button
            className="owner-access"
            type="button"
            onClick={() => {
              if (isOwner) {
                sessionStorage.removeItem("profile-owner-password");
                setOwnerPassword(null);
                setIsOwner(false);
                setAvatarStatus("");
              } else {
                setShowOwnerLogin(true);
              }
            }}
          >
            {isOwner ? "Sign out" : "Nice seeing you here!"}
          </button>
        </footer>
      </main>

      {showOwnerLogin && (
        <div className="owner-modal-backdrop" role="presentation">
          <section className="owner-modal" role="dialog" aria-modal="true" aria-labelledby="owner-login-title">
            <button
              className="owner-modal-close"
              type="button"
              onClick={() => setShowOwnerLogin(false)}
              aria-label="Close owner sign in"
            >
              ×
            </button>
            <span className="overline">Private controls</span>
            <h2 id="owner-login-title">Unlock owner mode</h2>
            <form onSubmit={unlockOwnerControls}>
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="Owner password"
                aria-label="Owner password"
                autoComplete="current-password"
                required
              />
              <button type="submit">Unlock</button>
            </form>
            {avatarStatus && <p className="owner-feedback" role="status">{avatarStatus}</p>}
          </section>
        </div>
      )}
      {mediaCrop && (
        <ImageCropModal
          file={mediaCrop.file}
          aspectRatio={mediaCrop.kind === "avatar" ? 1 : 19 / 6}
          title={mediaCrop.kind === "avatar" ? "Adjust profile picture" : "Adjust cover photo"}
          onCancel={() => setMediaCrop(null)}
          onConfirm={(file) => {
            const kind = mediaCrop.kind;
            setMediaCrop(null);
            if (kind === "avatar") {
              updateAvatar(file);
            } else {
              updateCover(file);
            }
          }}
        />
      )}
    </div>
  );
}
