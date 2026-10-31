import { mediaUrl } from '../api.js';

export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (user?.avatar_url)
    return <img className="avatar" style={style} src={mediaUrl(user.avatar_url)} alt="" />;
  return (
    <span className="avatar fallback" style={style} aria-hidden="true">
      {(user?.display_name || user?.username || '?')[0].toUpperCase()}
    </span>
  );
}
