import urllib.request
import json
import subprocess
import os
import time

TOKEN = os.environ.get('GITHUB_TOKEN', '')
USER = 'docdrilofficial'

REMAINING_APPS = [
    {
        'folder': 'slide showcaser',
        'repo': 'slideshowcaser',
        'desc': 'Slix (SlideShowcaser) — Browser-based 3D motion graphics and perspective showcase editor in Three.js (slix.docdril.com)'
    },
    {
        'folder': 'Doctool',
        'repo': 'docdril-tools',
        'desc': 'Docdril Tools — Ultra-fast local desktop file converter, compressor & image utility (tools.docdril.com)'
    },
    {
        'folder': 'flute',
        'repo': 'flute-audio',
        'desc': 'FLUTE Audio — Obsidian-styled binaural synthesizer, 7 Solfeggio frequencies & creator SFX bridge (flute.docdril.com)'
    },
    {
        'folder': 'research-workspace/Notes-app',
        'repo': 'docdril-notes',
        'desc': 'Docdril Notes — Local-first markdown productivity notes app with Google Drive cloud sync (notes.docdril.com)'
    },
    {
        'folder': 'research-workspace/Browser',
        'repo': 'private-browser',
        'desc': 'Private Browser — Lightweight privacy-first desktop web browser built with Electron (browser.docdril.com)'
    }
]

def create_with_retry(repo_name, description, max_retries=6, delay=30):
    url = 'https://api.github.com/user/repos'
    data = json.dumps({
        'name': repo_name,
        'description': description,
        'private': True
    }).encode()

    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'Authorization': f'token {TOKEN}',
                'User-Agent': 'Docdril-Pusher',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data_resp = json.loads(resp.read().decode())
                print(f'  [GitHub API] Created: {data_resp.get("html_url")}')
                return True
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if 'already exists' in body or 'name already exists' in body:
                print(f'  [GitHub API] Repo "{repo_name}" already exists, proceeding...')
                return True
            elif e.code == 403 and 'secondary rate limit' in body:
                print(f'  [Attempt {attempt}/{max_retries}] GitHub secondary rate limit active. Waiting {delay}s...')
                time.sleep(delay)
            else:
                print(f'  [GitHub API] Error {e.code}: {body}')
                return False
    return False

def push_app(app_info):
    folder = app_info['folder']
    repo = app_info['repo']
    desc = app_info['desc']
    cwd = os.path.abspath(folder)

    print(f'\n========================================')
    print(f'Processing {repo} (Folder: {folder})')
    print(f'========================================')

    if not create_with_retry(repo, desc):
        print(f'Could not create {repo} after retries.')
        return False

    git_dir = os.path.join(cwd, '.git')
    if not os.path.exists(git_dir):
        subprocess.run(['git', 'init'], cwd=cwd, check=True)
        print('  Initialized new git repository.')

    subprocess.run(['git', 'config', 'user.name', 'docdril'], cwd=cwd, check=True)
    subprocess.run(['git', 'config', 'user.email', 'izackstudio1@gmail.com'], cwd=cwd, check=True)
    subprocess.run(['git', 'branch', '-M', 'main'], cwd=cwd, check=True)
    subprocess.run(['git', 'add', '-A'], cwd=cwd, check=True)

    status_proc = subprocess.run(['git', 'status', '--porcelain'], cwd=cwd, capture_output=True, text=True)
    if status_proc.stdout.strip():
        commit_res = subprocess.run(
            ['git', 'commit', '-m', f'Release: {repo} for Docdril Ecosystem'],
            cwd=cwd,
            capture_output=True,
            text=True
        )
        print('  Committed changes:', commit_res.stdout.splitlines()[0] if commit_res.stdout else 'done')
    else:
        print('  No new changes to commit.')

    remote_url = f'https://{USER}:{TOKEN}@github.com/{USER}/{repo}.git'
    subprocess.run(['git', 'remote', 'remove', 'origin'], cwd=cwd, stderr=subprocess.DEVNULL)
    subprocess.run(['git', 'remote', 'add', 'origin', remote_url], cwd=cwd, check=True)

    print(f'  Pushing to https://github.com/{USER}/{repo}.git ...')
    push_res = subprocess.run(
        ['git', 'push', '-u', 'origin', 'main', '--force'],
        cwd=cwd,
        capture_output=True,
        text=True
    )
    if push_res.returncode == 0:
        print(f'  SUCCESS: {repo} is pushed to GitHub main branch!')
        # Sleep 5s to avoid hitting secondary rate limits on subsequent creates
        time.sleep(8)
        return True
    else:
        print(f'  PUSH FAILED: {push_res.stderr}')
        return False

def main():
    success = []
    failed = []
    for app in REMAINING_APPS:
        if push_app(app):
            success.append(app['repo'])
        else:
            failed.append(app['repo'])

    print('\n========================================')
    print('REMAINING BATCH SUMMARY')
    print('========================================')
    print(f'Successfully pushed ({len(success)}):')
    for s in success:
        print(f'  - https://github.com/{USER}/{s}')
    if failed:
        print(f'Failed ({len(failed)}):')
        for f in failed:
            print(f'  - {f}')

if __name__ == '__main__':
    main()
