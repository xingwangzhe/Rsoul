import { h } from "vue";
import { NIcon } from "naive-ui";
import {
  FileTrayFullOutline,
  Folder,
  FolderOpenOutline,
} from "@vicons/ionicons5";
import type { TreeOption } from "naive-ui";

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
  let label = b.name;
  if (!b.is_dir && b.size != null) {
    label += ` (${formatSize(b.size)})`;
  }
  const node: NaiveNode = {
    label,
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
