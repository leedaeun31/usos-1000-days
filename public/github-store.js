const REPO = "/repos/leedaeun31/usos-1000-days";
export class GitHubStore {
  constructor(token, request = (...args) => fetch(...args)) {
    this.token = token;
    this.request = request;
    this.head = null;
  }
  async api(path, method = "GET", body) {
    const res = await this.request("https://api.github.com" + path, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + this.token,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    if (!res.ok) {
      const error = new Error(
        res.status === 401
          ? "토큰이 올바르지 않거나 만료됐어요. 다시 연결해 주세요."
          : res.status === 403
            ? "GitHub 권한 또는 요청 한도를 확인해 주세요. 이 저장소의 Contents 쓰기 권한이 필요해요."
            : res.status === 409 || res.status === 422
              ? "다른 변경 사항과 충돌했어요. 초안을 저장하고 최신 내용을 불러온 뒤 다시 적용해 주세요."
              : `GitHub 요청 실패 (${res.status}). 저장소 선택과 권한을 확인해 주세요.`,
      );
      error.status = res.status;
      throw error;
    }
    return res.status === 204 ? null : res.json();
  }
  async login() {
    const user = await this.api("/user");
    if (user.login.toLowerCase() !== "leedaeun31")
      throw new Error("leedaeun31 계정의 토큰으로 연결해 주세요.");
    await this.api(REPO);
    return user.login;
  }
  async load() {
    const ref = await this.api(REPO + "/git/ref/heads/main");
    const commit = await this.api(REPO + "/git/commits/" + ref.object.sha);
    const tree = await this.api(
      REPO + "/git/trees/" + commit.tree.sha + "?recursive=1",
    );
    if (tree.truncated)
      throw new Error("파일 목록이 너무 커요. 관리자에게 문의해 주세요.");
    const file = tree.tree.find((f) => f.path === "public/content.json");
    if (!file) throw new Error("콘텐츠 파일을 찾지 못했어요.");
    const blob = await this.api(REPO + "/git/blobs/" + file.sha);
    const bytes = Uint8Array.from(atob(blob.content.replace(/\s/g, "")), (c) =>
      c.charCodeAt(0),
    );
    const content = JSON.parse(new TextDecoder().decode(bytes));
    this.head = ref.object.sha;
    return content;
  }
  async publish(content) {
    if (!this.head)
      throw new Error("계정을 연결하고 최신 내용을 먼저 불러와 주세요.");
    const ref = await this.api(REPO + "/git/ref/heads/main");
    if (ref.object.sha !== this.head)
      throw new Error(
        "GitHub에 더 최신 변경이 있어요. 초안을 저장하고 최신 내용을 불러온 뒤 필요한 변경을 다시 적용해 주세요.",
      );
    const base = await this.api(REPO + "/git/commits/" + this.head);
    const blob = await this.api(REPO + "/git/blobs", "POST", {
      content: JSON.stringify(content, null, 2) + "\n",
      encoding: "utf-8",
    });
    const tree = await this.api(REPO + "/git/trees", "POST", {
      base_tree: base.tree.sha,
      tree: [
        {
          path: "public/content.json",
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        },
      ],
    });
    const commit = await this.api(REPO + "/git/commits", "POST", {
      message: "Update UsOS content from admin",
      tree: tree.sha,
      parents: [this.head],
    });
    try {
      await this.api(REPO + "/git/refs/heads/main", "PATCH", {
        sha: commit.sha,
        force: false,
      });
    } catch (error) {
      try {
        const current = await this.api(REPO + "/git/ref/heads/main");
        if (current.object.sha === commit.sha) {
          this.head = commit.sha;
          return commit.sha;
        }
      } catch {}
      throw error;
    }
    this.head = commit.sha;
    return commit.sha;
  }
  logout() {
    this.token = "";
    this.head = null;
  }
}
