import urllib.request
import json
import subprocess
import os
import sys

TOKEN = os.environ.get('GITHUB_TOKEN', '')
USER = 'docdrilofficial'

APPS = [
    {
        'folder': 'DocStudio',
        'repo': 'docstudio',
        'desc': 'DocStudio — Central operating system, unified SSO auth & billing hub for Docdril (docstudio.docdril.com)'
    },
    {
        'folder': 'docdril-proposal-builder',
        'repo': 'proposal-builder',
        'desc': 'Founder Proposal Studio — Instant proposal and contract builder with e-signatures & client portal (proposal.docdril.com)'
    },
    {
        'folder': 'animature',
        'repo': 'motion-toolkit',
        'desc': 'Premiere Motion Toolkit — 28+ cinematic motion presets, curve grapher & gap cutter (motion.docdril.com)'
    },
    {
        'folder': 'text animation',
        'repo': 'typomotion',
        'desc': 'TypoMotion Studio — Studio-grade 60 FPS GPU kinetic typography and viral reel generator (typomotion.docdril.com)'
    },
    {
        'folder': 'image2pdf-maker',
        'repo': 'image-studio',
        'desc': 'Docdril Image Studio — Media organizer, EXIF privacy cleaner, batch converter & ordered PDF publishing (image.docdril.com)'
    },
    {
        'folder': 'auto-cutter',
        'repo': 'autocutter',
        'desc': 'AutoCutter — Professional ML silence and dead air removal for talking-head videos with Silero VAD (autocutter.docdril.com)'
    },
    {
        'folder': 'media-scaler',
        'repo': 'media-scaler',
        'desc': 'Media Scaler AI — GPU super-resolution image and video upscaler (2x-8x) powered by PyTorch Real-ESRGAN (scaler.docdril.com)'
    },
    {
        'folder': 'video watermark remover',
        'repo': 'wiper-ai',
        'desc': 'Wiper AI — Deep neural inpainting watermark, logo, and object remover for video and images (wiper.docdril.com)'
    },
    {
        'folder': 'voicegen',
        'repo': 'voice-studio',
        'desc': 'Voice Studio — Studio-grade AI voiceover and voice cloning workstation with script editor (voice.docdril.com)'
    },
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

def create_github_repo(repo_name, description):
    url = 'https://api.github.com/user/repos'
    data = json.dumps({
        'name': repo_name,
        'description': description,
        'private': True
    }).encode()
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
            data = json.loads(resp.read().decode())
            print(f'  [GitHub API] Created: {data.get("html_url")}')
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if 'already exists' in body or 'name already exists' in body:
            print(f'  [GitHub API] Repo "{repo_name}" already exists, pushing updates...')
            return True
        else:
            print(f'  [GitHub API] Error creating repo {repo_name}: {body}')
            return False

def push_app(app_info):
    folder = app_info['folder']
    repo = app_info['repo']
    desc = app_info['desc']
    cwd = os.path.abspath(folder)

    print(f'\n========================================')
    print(f'Processing {repo} (Folder: {folder})')
    print(f'========================================')

    if not os.path.exists(cwd):
        print(f'ERROR: Folder {cwd} does not exist!')
        return False

    # 1. Create repo on GitHub
    if not create_github_repo(repo, desc):
        return False

    # 2. Init git if needed
    git_dir = os.path.join(cwd, '.git')
    if not os.path.exists(git_dir):
        subprocess.run(['git', 'init'], cwd=cwd, check=True)
        print('  Initialized new git repository.')

    # Set git config locally
    subprocess.run(['git', 'config', 'user.name', 'docdrilofficial'], cwd=cwd, check=True)
    subprocess.run(['git', 'config', 'user.email', '351932608+docdrilofficial@users.noreply.github.com'], cwd=cwd, check=True)
    subprocess.run(['git', 'branch', '-M', 'main'], cwd=cwd, check=True)

    # Clean staging of any AppleDouble or removed files
    subprocess.run(['git', 'add', '-A'], cwd=cwd, check=True)

    # Check if there are changes to commit
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

    # Setup remote
    remote_url = f'https://{USER}:{TOKEN}@github.com/{USER}/{repo}.git'
    subprocess.run(['git', 'remote', 'remove', 'origin'], cwd=cwd, stderr=subprocess.DEVNULL)
    subprocess.run(['git', 'remote', 'add', 'origin', remote_url], cwd=cwd, check=True)

    # Push to main
    print(f'  Pushing to https://github.com/{USER}/{repo}.git ...')
    push_res = subprocess.run(
        ['git', 'push', '-u', 'origin', 'main', '--force'],
        cwd=cwd,
        capture_output=True,
        text=True
    )
    if push_res.returncode == 0:
        print(f'  SUCCESS: {repo} is pushed to GitHub main branch!')
        return True
    else:
        print(f'  PUSH FAILED: {push_res.stderr}')
        return False

def main():
    success = []
    failed = []
    for app in APPS:
        try:
            if push_app(app):
                success.append(app['repo'])
            else:
                failed.append(app['repo'])
        except Exception as e:
            print(f'Exception while processing {app["repo"]}: {e}')
            failed.append(app['repo'])

    print('\n========================================')
    print('DEPLOYMENT BATCH SUMMARY')
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
