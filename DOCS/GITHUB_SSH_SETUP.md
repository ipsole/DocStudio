# GitHub Deployment & SSH Configuration

This repository (`DocStore` / `DocStudio`) is linked to GitHub repository **`ipsole/DocStudio`**.

## SSH Key Details
* **Key Type**: ED25519
* **Private Key Path**: `~/.ssh/id_ed25519_docstudio`
* **Public Key Path**: `~/.ssh/id_ed25519_docstudio.pub`
* **Comment**: `docstudio-github-deploy-key`

## Public Key (For GitHub Deploy Keys)
```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO0nJOxVBAdWnYVnDPXjKgwPgF83yhIYnhQtw3yZg/TJ docstudio-github-deploy-key
```

## SSH Config (`~/.ssh/config`)
```ssh-config
Host github-docstudio
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_docstudio
  IdentitiesOnly yes
```

## Git Remote Configuration
* **Remote Name**: `origin`
* **Remote URL**: `github-docstudio:ipsole/DocStudio.git`
* **SSH Command Config**: `git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_docstudio -o IdentitiesOnly=yes"`

## To Push Changes
```bash
git push origin main
```
*(Requires the public key above to be added as a Deploy Key with **Write Access** enabled in `https://github.com/ipsole/DocStudio/settings/keys`)*.
