# MCP Discord Image Downloader

A Discord bot MCP server that downloads all images from a specified Discord channel using the Model Context Protocol (MCP).

## Features

- Downloads images from any text channel by fetching messages and attachments
- Supports image formats: JPG, JPEG, PNG, GIF, WEBP, SVG
- Saves images to a configurable directory


## Requirements

- Node.js (v22.18.0+ recommended)
- Discord bot token with permissions to read messages and message history
- MCP Protocol SDK

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LemonMantis5571/MCP-Discord-Image-Donwloader.git
   cd MCP-Discord-Image-Donwloader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```


## Usage

You can run the MCP server with:
```bash
npx tsx src/main.ts 
```

**Note**: You must provide your Discord bot token via environment variables (e.g., in a `.env` file or your shell environment) as `DISCORD_TOKEN`.  
Without this token, the bot will not be able to connect to Discord and the server will fail to start.

## MCP Client Configuration

You can configure your MCP client with the following JSON configuration (adjust paths to match your system):

```json
"discord-images": {
  "command": "npx",
  "args": ["-y", "tsx", "path/to/your/main.ts"],
  "cwd": "path/to/your/project/src",
  "env": {
    "DISCORD_TOKEN": "your_bot_token_here"
  },
  "permissions": {
    "filesystem": {
      "read": [
        "path/to/downloads",
        "path/to/another/folder"
      ],
      "write": [
        "path/to/downloads",
        "path/to/another/folder"
      ]
    }
  }
}
```

## Recommended Setup for File Access

For the best usability, run this MCP alongside the official **filesystem MCP server** and grant access to the same directories where images are saved.  
Example `mcpServers` configuration:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "your//path/here
  ]
}
```
### MCP Tool: `download_channel_images`

#### Input Arguments
| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `channel_id` | string | Discord channel ID to download images from | Required |
| `output_dir` | string | Directory path to save images | `./downloads` |
| `limit` | number | Maximum number of messages to fetch from the channel | 100 |
| `include_metadata` | boolean | Include message metadata in filenames (true/false) | true |

#### Response
Returns a JSON containing:
- Success status
- Channel name
- Number of images found and downloaded
- Output directory path
- Metadata JSON file with detailed info about the download

## Permissions

The bot requires the following permissions in the target Discord channel:
- View Channel
- Read Message History

If permissions are insufficient, the tool will return an error indicating the issue.



## Troubleshooting

- Make sure the bot has permissions in the Discord channel
- If using environment variables, ensure `.env` is loaded correctly or pass tokens via environment
- Use the MCP inspector or logs to debug connection or permission issues, for this you'll have to actually use .env inside the root dir.

## License
MIT License

Repository: https://github.com/LemonMantis5571/MCP-Discord-Image-Donwloader