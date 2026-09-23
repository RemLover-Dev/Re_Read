import os
import sys
import json
import subprocess
from pathlib import Path

def get_python_exe():
    rems_dl_venv = Path(r"E:\projects\RemLover-Dev\Rems Dl\.venv\Scripts\python.exe")
    if rems_dl_venv.exists():
        return str(rems_dl_venv)
    return sys.executable

def load_env_credentials():
    env_paths = [
        Path(__file__).parent.parent / ".env",
        Path(r"E:\projects\RemLover-Dev\Rems Reader\.env"),
        Path(r"E:\projects\RemLover-Dev\Rems Dl\.env"),
    ]
    login = os.getenv("ZEROCHAN_LOGIN")
    password = os.getenv("ZEROCHAN_PASSWORD")

    if not login or not password:
        for p in env_paths:
            if p.exists():
                try:
                    for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
                        line = line.strip()
                        if line.startswith("ZEROCHAN_LOGIN=") and not login:
                            login = line.split("=", 1)[1].strip()
                        elif line.startswith("ZEROCHAN_PASSWORD=") and not password:
                            password = line.split("=", 1)[1].strip()
                except Exception:
                    pass

    return login or "lovermover", password or "l123454321l"

def query_zerochan(tag, page=1, limit=25, custom_user=None, custom_pass=None):
    if custom_user and custom_pass:
        username, password = custom_user, custom_pass
    else:
        username, password = load_env_credentials()

    tags_to_try = [tag]
    if " (Re:Zero)" in tag:
        tags_to_try.append(tag.replace(" (Re:Zero)", "").strip())
    elif "(" not in tag:
        tags_to_try.append(f"{tag} (Re:Zero)")

    last_error = None
    for cur_tag in tags_to_try:
        clean_tag = cur_tag.strip().replace(" ", "+")
        url = f"https://www.zerochan.net/{clean_tag}"

        python_exe = get_python_exe()
        start = (page - 1) * limit + 1
        end = page * limit

        cmd = [
            python_exe, "-m", "gallery_dl",
            "-u", username, "-p", password,
            "-j",
            "--range", f"{start}-{end}",
            url
        ]

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=40,
                check=False
            )

            posts = []
            if proc.stdout:
                try:
                    data = json.loads(proc.stdout)
                    seen_ids = set()
                    for msg in data:
                        if not isinstance(msg, list) or len(msg) < 2:
                            continue
                        msg_type = msg[0]
                        kw = msg[2] if msg_type == 3 and len(msg) >= 3 else msg[1]
                        if not isinstance(kw, dict):
                            continue

                        pid = kw.get("id")
                        if pid and pid not in seen_ids:
                            seen_ids.add(pid)
                            file_url = kw.get("file_url") or f"https://static.zerochan.net/.full.{pid}.jpg"
                            thumb_url = kw.get("thumbnail") or f"https://s3.zerochan.net/240/{str(pid)[-2:]}/{pid}.jpg"
                            width = int(kw.get("width") or 1920)
                            height = int(kw.get("height") or 1080)
                            aspect_ratio = "Landscape" if width > height else "Portrait"
                            
                            res_badge = "HD"
                            if width >= 3840 or height >= 2160: res_badge = "4K UHD"
                            elif width >= 2560 or height >= 1440: res_badge = "2K QHD"
                            elif width >= 1920 or height >= 1080: res_badge = "FHD"

                            tags_list = kw.get("tags") or [cur_tag, "Re:Zero"]
                            if isinstance(tags_list, str):
                                tags_list = tags_list.split()

                            posts.append({
                                "id": str(pid),
                                "provider": "zerochan",
                                "preview_url": thumb_url,
                                "file_url": file_url,
                                "width": width,
                                "height": height,
                                "aspect_ratio": aspect_ratio,
                                "resolution_badge": res_badge,
                                "tags": tags_list[:15],
                                "source": kw.get("source") or f"https://www.zerochan.net/{pid}"
                            })
                except Exception as parse_err:
                    last_error = f"Zerochan JSON parse error: {parse_err}"
                    continue

            if posts:
                return {
                    "success": True,
                    "posts": posts,
                    "total_found": len(posts),
                    "message": None
                }

        except Exception as e:
            last_error = str(e)
            continue

    return {
        "success": True if not last_error else False,
        "posts": [],
        "total_found": 0,
        "message": last_error or "No posts found for this character tag on Zerochan"
    }

if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "Rem (Re:Zero)"
    page = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 25
    custom_user = sys.argv[4] if len(sys.argv) > 4 else None
    custom_pass = sys.argv[5] if len(sys.argv) > 5 else None

    res = query_zerochan(tag, page, limit, custom_user, custom_pass)
    print(json.dumps(res))
