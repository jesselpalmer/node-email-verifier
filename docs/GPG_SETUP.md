# GPG Setup for Signed Releases

## Why Sign Tags?

Signed tags provide cryptographic proof that the release came from a trusted maintainer. GitHub
shows these as "Verified" with a green checkmark.

## Setup Instructions

### 1. Install GPG

```bash
# macOS
brew install gnupg

# Ubuntu/Debian
sudo apt-get install gnupg

# Check installation
gpg --version
```

### 2. Generate a GPG Key

```bash
# Generate a new key
gpg --full-generate-key

# Select:
# - (1) RSA and RSA (default)
# - 4096 bits
# - Key expires in 2 years (recommended)
# - Your real name
# - Your GitHub email address
```

### 3. List Your Keys

```bash
# List GPG keys
gpg --list-secret-keys --keyid-format=long

# Output example:
# sec   rsa4096/3AA5C34371567BD2 2016-03-10 [expires: 2017-03-10]
#       ABCDEF1234567890ABCDEF1234567890ABCDEF12
# uid   Your Name <you@example.com>
```

### 4. Export Your Public Key

```bash
# Export public key (use your key ID from above)
gpg --armor --export 3AA5C34371567BD2
```

### 5. Add to GitHub

1. Go to <https://github.com/settings/keys>
2. Click "New GPG key"
3. Paste your public key
4. Save

### 6. Configure Git

```bash
# Tell git about your GPG key
git config --global user.signingkey 3AA5C34371567BD2

# Optional: Always sign tags
git config --global tag.gpgSign true

# Optional: Always sign commits
git config --global commit.gpgSign true
```

### 7. Test Signing

```bash
# Create a signed tag
git tag -s test-tag -m "Test signed tag"

# Verify the signature
git tag -v test-tag

# Delete test tag
git tag -d test-tag
```

## Using GPG with Claude/AI

For AI agents to create signed tags, you'll need to:

1. **Use SSH agent forwarding** or
2. **Create tags locally** and push them

The AI can prepare everything, but the actual signing needs your GPG key.

## Troubleshooting

### "gpg: signing failed: Inappropriate ioctl for device"

```bash
export GPG_TTY=$(tty)
echo "export GPG_TTY=\$(tty)" >> ~/.bashrc
```

### "gpg: signing failed: No secret key"

Make sure your email in git config matches your GPG key:

```bash
git config --global user.email "your-gpg-email@example.com"
```

## Alternative: Unsigned Tags

If GPG setup is too complex, you can continue using annotated tags:

```bash
git tag -a 3.4.0 -m "release: 3.4.0"
```

These provide metadata but no cryptographic verification.
