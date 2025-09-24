# Rsoul

## IMPORTANT: Tauri API import (CRITICAL)

When calling Tauri commands from the frontend, always import `invoke` from the new `@tauri-apps/api/core` package. Do NOT use the legacy import from `@tauri-apps/api/tauri` — that is deprecated in recent Tauri versions and will cause runtime errors.

Correct:

```/dev/null/tauri-invoke.example#L1-3
import { invoke } from '@tauri-apps/api/core'
```

Incorrect (old/legacy):

```/dev/null/tauri-invoke-wrong.example#L1-2
import { invoke } from '@tauri-apps/api/tauri'
```

I have updated frontend components in the project to use `@tauri-apps/api/core` where applicable (for example, the interactive terminal component now imports `invoke` from `@tauri-apps/api/core`).

## NOTE: Vue template / import mistakes ("<context>")

You may encounter an incorrect import or usage that looks like `<context>` in templates or `import { context } from 'vue'` in scripts. Vue does not provide a `<context>` component or a named export `context` from the core package. If you see such usage, replace it with the appropriate Composition API utilities:

- To access the current component instance and its context, use `getCurrentInstance()` from Vue.
- To provide/inject values across component boundaries use `provide()` / `inject()`.
- For reactive state and lifecycle hooks use `ref`, `reactive`, `onMounted`, etc.

Examples (correct patterns):

Access instance (if you truly need instance internals):

```/dev/null/vue-getCurrentInstance.example#L1-3
import { getCurrentInstance } from 'vue'
const instance = getCurrentInstance()
```

Provide / inject:

```/dev/null/vue-provide-inject.example#L1-4
// Provider
import { provide } from 'vue'
provide('key', someValue)

// Consumer
import { inject } from 'vue'
const value = inject('key')
```

If you find a stray `<context>` tag in a template, remove it — it's not a standard Vue component. If a third-party library documented a `<context>` usage, consult that library's docs for the correct component name or API.

## NOTE: Development Workflow

千万不要使用build方法来检查错误，这样会浪费时间。Always use `bun run tauri dev` for development and testing, as building takes significantly longer and is only needed for production releases.

---

## Overview

Rsoul is a modern Markdown editor built with Tauri, Vue 3, and Naive UI. It provides a seamless editing experience for Markdown files with advanced features like Frontmatter editing, file tree navigation, and real-time preview. The application is designed for developers and writers who need a powerful yet lightweight editor for managing Markdown content.

## Features

- **Markdown Editing**: Full-featured Markdown editor with syntax highlighting, toolbar, and live preview
- **Frontmatter Support**: Customizable Frontmatter fields with type validation (string, number, array, date, etc.)
- **File Tree Navigation**: Browse and select files from a directory tree
- **Real-time Updates**: Automatic parsing and updating of Frontmatter from Markdown content
- **Frontmatter Suggestions**: Intelligent suggestions for string and tag fields based on existing Markdown files, with usage counts
- **Cross-platform**: Built with Tauri for Windows, macOS, and Linux
- **Internationalization**: Support for multiple languages (currently English and Chinese)
- **Plugin Architecture**: Extensible with Tauri plugins for file system, dialogs, and more

## Installation

### Prerequisites

- Bun (latest stable) - for frontend dependency management
- Rust (latest stable) - for backend dependency management
- Tauri CLI

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rsoul.git
   cd rsoul
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run in development mode:
   ```bash
   bun run tauri dev
   ```

4. Build for production:
   ```bash
   bun run tauri build
   ```

## Usage

### Basic Editing

1. Launch the application
2. Select a folder using the "Add Folder" button in the left sidebar
3. Click on a Markdown file in the file tree to open it
4. Edit the content in the main editor area
5. Use the toolbar for formatting options
6. Save changes automatically or manually

### Frontmatter Editing

1. Open a Markdown file with Frontmatter
2. Click the "FrontMatter" button in the toolbar
3. Edit fields in the modal dialog
4. Click "Save" to update the Frontmatter

### Configuring Frontmatter Fields

1. Go to Settings
2. Use the "Set Frontmatter" section to add/edit field definitions
3. Define field names and types (string, number, string[], date, etc.)

## Architecture

### Frontend (Vue 3 + Naive UI)

- **Components**:
  - `Editor.vue`: Main Markdown editor component
  - `FrontmatterEditor.vue`: Modal for editing Frontmatter
  - `FileTree.vue`: File browser component
  - `SetFrontmatter.vue`: Configuration for Frontmatter fields

- **Utils**:
  - `fileTreeUtils.ts`: Utilities for file tree operations, including loading, mapping, and file content retrieval
  - `frontmatterUtils.ts`: Utilities for Frontmatter handling, including serialization, schema management, and form data processing
  - `editorUtils.ts`: Utilities for editor operations, including saving Markdown content with Frontmatter

- **State Management**: Reactive Vue composition API
- **Styling**: Scoped CSS with Naive UI theme

### Backend (Tauri + Rust)

- **Commands**:
  - `get_file_tree`: Retrieve file tree structure
  - `get_file_content`: Read file content
  - `save_markdown`: Save Markdown content
  - `load_frontmatter`: Load Frontmatter field definitions
  - `save_frontmatter`: Save Frontmatter field definitions

- **Storage**: Tauri Store plugin for persistent data
- **File System**: Tauri FS plugin for file operations

## Key Dependencies

To avoid reinventing the wheel, Rsoul leverages several key libraries for robust functionality:

### Frontend Dependencies

- **naive-ui**: Comprehensive Vue 3 UI component library providing modern, accessible components like modals, forms, buttons, and data tables.
- **front-matter**: Specialized library for parsing and generating YAML frontmatter in Markdown files, handling serialization/deserialization automatically.
- **i18next**: Powerful internationalization framework enabling multi-language support with easy translation management.
- **md-editor-v3**: Feature-rich Markdown editor component offering syntax highlighting, toolbar, live preview, and extensibility.
- **@vicons/ionicons5**: Icon library providing a wide range of high-quality icons from Ionicons 5 for consistent UI elements.
- **vue-router**: Official Vue.js router for single-page application navigation and routing.
- **@tauri-apps/api**: Tauri API for secure communication between frontend and backend, enabling file operations and system interactions.
- **lucide-vue-next**: Modern icon library with clean, consistent icons for additional UI elements.

### Backend Dependencies

- **tauri**: Core framework for building desktop applications with web technologies, providing the runtime and API bridge between Rust and JavaScript.
- **tauri-plugin-opener**: Plugin for opening URLs and files with system default applications, enabling external link handling.
- **serde**: Powerful serialization/deserialization framework for Rust, with derive macros for automatic JSON/YAML handling.
- **serde_json**: JSON serialization support built on top of serde, used for data interchange between frontend and backend.
- **tauri-plugin-fs**: File system plugin providing secure access to read/write files and directories.
- **tauri-plugin-dialog**: Dialog plugin for native file/folder selection dialogs and message boxes.
- **tauri-plugin-store**: Persistent key-value storage plugin for saving application settings and data.
- **serde_yaml**: YAML serialization/deserialization support, used for parsing frontmatter in Markdown files.
- **walkdir**: Recursive directory traversal library, used for scanning all Markdown files in the selected directory.

## API Reference

### Frontend Props/Events

#### Editor Component

- **Props**:
  - `content: String` - Markdown content
  - `path: String` - File path for saving

- **Events**:
  - `updateFrontmatter` - Emitted when Frontmatter is updated

#### FrontmatterEditor Component

- **Props**:
  - `currentFrontmatter: Object` - Current Frontmatter data

- **Events**:
  - `updateFrontmatter` - Emitted with updated Frontmatter

### Backend Commands

#### get_file_tree

Retrieves the file tree structure.

**Parameters**: None

**Returns**: `TreeNode` object representing the file structure

#### get_file_content

Reads the content of a file.

**Parameters**:
- `filePath: String` - Path to the file

**Returns**: `String` - File content

#### save_markdown

Saves Markdown content to a file.

**Parameters**:
- `filePath: String` - Path to save the file
- `content: String` - Markdown content

**Returns**: `Result<(), String>`

#### load_frontmatter

Loads Frontmatter field definitions.

**Parameters**: None

**Returns**: `Vec<FrontmatterField>`

#### collect_frontmatter_suggestions

Collects and persists frontmatter value suggestions from all Markdown files in the selected directory. Updates usage counts for string and tag values.

**Parameters**: None

**Returns**: `Result<(), String>`

#### load_frontmatter_suggestions

Loads persisted frontmatter suggestions with usage counts.

**Parameters**: None

**Returns**: `FrontmatterSuggestions`

#### save_frontmatter

Saves Frontmatter field definitions.

**Parameters**:
- `fields: Vec<FrontmatterField>` - Field definitions

**Returns**: `Result<(), String>`

### Utility Functions

#### frontmatterUtils.ts

##### serializeFM(attrs, content)

Serializes frontmatter attributes and content into a Markdown string.

**Parameters**:
- `attrs: Record<string, any>` - Frontmatter attributes
- `content: string` - Markdown content

**Returns**: `string` - Full Markdown string with frontmatter

##### loadFrontmatterSchema()

Loads the frontmatter field schema from backend.

**Returns**: `Promise<Array<{ key: number; title: string; field_type: string }>>`

##### loadFrontmatterSuggestions()

Loads frontmatter suggestions from backend.

**Returns**: `Promise<Record<string, Array<{ value: string; count: number }>>>`

##### collectFrontmatterSuggestions()

Collects frontmatter suggestions from all Markdown files.

**Returns**: `Promise<void>`

##### saveFrontmatterFields(fields)

Saves frontmatter field definitions to backend.

**Parameters**:
- `fields: Array<{ key: number; title: string; field_type: string }>` - Field definitions

**Returns**: `Promise<void>`

##### initializeFormData(schema, currentFrontmatter)

Initializes form data based on schema and current frontmatter.

**Parameters**:
- `schema: Array<{ key: number; title: string; field_type: string }>` - Field schema
- `currentFrontmatter?: Record<string, any>` - Current frontmatter data

**Returns**: `Record<string, any>` - Initialized form data

##### saveFormDataToFrontmatter(schema, formData)

Converts form data back to frontmatter object.

**Parameters**:
- `schema: Array<{ key: number; title: string; field_type: string }>` - Field schema
- `formData: Record<string, any>` - Form data

**Returns**: `Record<string, any>` - Frontmatter object

##### getFieldOptions(fieldTitle, suggestions)

Gets field options for select inputs.

**Parameters**:
- `fieldTitle: string` - Field title
- `suggestions: Record<string, Array<{ value: string; count: number }>>` - Suggestions data

**Returns**: `Array<{ label: string; value: string }>` - Options array

#### editorUtils.ts

##### saveMarkdown(content, filePath)

Saves Markdown content to a file.

**Parameters**:
- `content: string` - Markdown content
- `filePath: string` - File path

**Returns**: `Promise<void>`

##### handleSave(text, frontmatter, filePath, serializeFM)

Handles the complete save process including frontmatter serialization.

**Parameters**:
- `text: string` - Markdown text
- `frontmatter: Record<string, any>` - Frontmatter data
- `filePath: string` - File path
- `serializeFM: Function` - Serialization function

**Returns**: `Promise<void>`

#### fileTreeUtils.ts

##### loadFileTree(path)

Loads file tree from a specific path.

**Parameters**:
- `path: string` - Directory path

**Returns**: `Promise<{ treeData: NaiveNode[]; error: string | null; selectedPath: string }>`

##### getFileTree()

Gets file tree from backend.

**Returns**: `Promise<{ treeData: NaiveNode[]; error: string | null; selectedPath: string | null }>`

##### getStoredPath()

Gets the stored directory path.

**Returns**: `Promise<string | null>`

##### getFileContent(filePath)

Gets content of a file.

**Parameters**:
- `filePath: string` - File path

**Returns**: `Promise<string>`

##### mapNode(b)

Maps backend node to Naive UI node.

**Parameters**:
- `b: BackendNode` - Backend node

**Returns**: `NaiveNode` - Naive UI node

##### formatSize(n)

Formats file size in human-readable format.

**Parameters**:
- `n: number` - Size in bytes

**Returns**: `string` - Formatted size

##### updatePrefixWithExpanded(keys, option, meta)

Updates node prefix based on expand/collapse state.

**Parameters**:
- `keys: Array<string | number>` - Expanded keys
- `option: Array<TreeOption | null>` - Tree options
- `meta: { node: TreeOption | null; action: "expand" | "collapse" | "filter" }` - Meta data

## Configuration

### Frontmatter Fields

Frontmatter fields are configured through the Settings page. Each field has:

- `key`: Unique identifier
- `title`: Display name
- `field_type`: Data type (string, number, string[], date, time, dateandtime)

### Internationalization

Language files are located in the `i18n/` directory. Currently supports:

- English (`en.json`)
- Chinese (`zh.json`)

## Development

### Project Structure

```
Rsoul/
├── src/
│   ├── components/
│   │   ├── Editor.vue
│   │   ├── FrontmatterEditor.vue
│   │   ├── FileTree.vue
│   │   └── SetFrontmatter.vue
│   ├── pages/
│   │   ├── Home.vue
│   │   ├── About.vue
│   │   └── Settings.vue
│   ├── utils/
│   │   ├── fileTreeUtils.ts
│   │   ├── frontmatterUtils.ts
│   │   └── editorUtils.ts
│   ├── App.vue
│   └── main.ts
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── get_file_content.rs
│   │   │   ├── get_file_tree.rs
│   │   │   ├── save_frontmatter.rs
│   │   │   └── save_markdown.rs
│   │   ├── lib.rs
│   │   └── main.rs
│   └── tauri.conf.json
├── i18n/
│   ├── en.json
│   └── zh.json
└── package.json
```

### Dependency Management

- **Frontend Dependencies**: Managed with Bun. Use `bun add <package>` to add new dependencies and `bun remove <package>` to remove them. Never manually edit `package.json` or `bun.lock`.
- **Backend Dependencies**: Managed with Cargo. Use `cargo add <crate>` to add new dependencies and `cargo remove <crate>` to remove them. Never manually edit `Cargo.toml` or `Cargo.lock`.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Testing

Run tests with:
```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0

- Initial release
- Basic Markdown editing
- Frontmatter support
- File tree navigation
- Cross-platform support

## Support

For support, please open an issue on GitHub or contact the maintainers.