import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DIN STIL · Barbería",
    short_name: "DIN STIL",
    description: "Reservá tu turno en DIN STIL en segundos.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2d4428",
    orientation: "portrait",
    icons: [
      {
        src: "/din-stil-mark.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/din-stil-mark.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  }
}
