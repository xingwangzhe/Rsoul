import { h } from "vue";
import { NIcon } from "naive-ui";
import {
  FileTrayFullOutline,
  Folder,
  FolderOpenOutline,
} from "@vicons/ionicons5";
import type { TreeOption } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

/**
 * 后端 TreeNode 类型（与 Rust 后端保持一致）
 */
export interface BackendNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: BackendNode[] | null;
  size?: number | null;
}

/**
 * Naive UI n-tree 需要的节点格式
 */
export interface NaiveNode {
  label: string;
  key: string;
  isDir: boolean;
  prefix?: () => any;
  children?: NaiveNode[];
}

/**
 * 将后端节点映射为 Naive UI 节点
 */
export function mapNode(b: BackendNode): NaiveNode {
  const node: NaiveNode = {
    label: b.name,
    key: b.path,
    isDir: b.is_dir,
    prefix: b.is_dir
      ? () => h(NIcon, null, { default: () => h(Folder) })
      : () => h(NIcon, null, { default: () => h(FileTrayFullOutline) }),
  };
  if (b.is_dir && b.children && Array.isArray(b.children)) {
    node.children = b.children.map(mapNode);
  }
  return node;
}

/**
 * 格式化文件大小
 */
export function formatSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * 处理展开/折叠时的图标更新
 */
export function updatePrefixWithExpanded(
  _keys: Array<string | number>,
  _option: Array<TreeOption | null>,
  meta: {
    node: TreeOption | null;
    action: "expand" | "collapse" | "filter";
  },
) {
  if (!meta.node) return;
  switch (meta.action) {
    case "expand":
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(FolderOpenOutline),
        });
      break;
    case "collapse":
      meta.node.prefix = () =>
        h(NIcon, null, {
          default: () => h(Folder),
        });
      break;
  }
}

/**
 * 从指定路径加载文件树
 */
export async function loadFileTree(path: string): Promise<{
  treeData: NaiveNode[];
  error: string | null;
  selectedPath: string;
}> {
  try {
    const res = await invoke<BackendNode>("get_file_tree_from_path", { path });
    if (!res) {
      return {
        treeData: [],
        error: "后端返回空结果",
        selectedPath: path,
      };
    }
    const treeData = [mapNode(res as BackendNode)];
    return { treeData, error: null, selectedPath: path };
  } catch (e) {
    console.error("调用错误", e);
    const error = e instanceof Error ? e.message : String(e);
    return { treeData: [], error, selectedPath: path };
  }
}



/**
 * 从后端拉取文件树（调用 Rust: get_file_tree）
 */
export async function getFileTree(): Promise<{
  treeData: NaiveNode[];
  error: string | null;
  selectedPath: string | null;
}> {
  try {
    // 先获取存储的路径
    const storedPath = await getStoredPath();
    if (!storedPath) {
      return {
        treeData: [],
        error: "没有存储的路径",
        selectedPath: null,
      };
    }

    // 使用存储的路径调用 get_file_tree_from_path
    const res = await invoke<BackendNode>("get_file_tree_from_path", { path: storedPath });
    if (!res) {
      return {
        treeData: [],
        error: "后端返回空结果",
        selectedPath: storedPath,
      };
    }

    const treeData = [mapNode(res as BackendNode)];
    return { treeData, error: null, selectedPath: storedPath };
  } catch (e) {
    console.error("调用错误", e);
    const error = e instanceof Error ? e.message : String(e);
    return { treeData: [], error, selectedPath: null };
  }
}

/**
 * 获取存储的路径
 */
export async function getStoredPath(): Promise<string | null> {
  try {
    return await invoke<string | null>("get_stored_path");
  } catch (e) {
    console.error("加载存储路径失败:", e);
    return null;
  }
}

/**
 * 获取文件内容
 */
export async function getFileContent(filePath: string): Promise<string> {
  return await invoke<string>("get_file_content", { filePath });
}
