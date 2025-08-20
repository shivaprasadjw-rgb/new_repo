type Props = { url: string; title: string };

export default function ShareButtons({ url, title }: Props) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const whatsapp = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
  const email = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
  const twitter = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <div className="flex items-center gap-3">
      <a className="text-sm text-primary hover:underline" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
      <a className="text-sm text-primary hover:underline" href={email}>Email</a>
      <a className="text-sm text-primary hover:underline" href={twitter} target="_blank" rel="noreferrer">Share</a>
    </div>
  );
}
