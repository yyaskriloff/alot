# ALOT drive

## Setup

```bash
brew install minio/stable/minio
mkdir data
```

add to the ~/.zshrc

```bash
minio-serve() {
    MINIO_ROOT_USER=admin MINIO_ROOT_PASSWORD=password123 minio server ${1:-~/minio/data} --console-address ":9001"
}
```
