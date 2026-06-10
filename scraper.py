#!/usr/bin/env python3
"""
Career Destiny — Job Data Scraper
==================================
多源抓取岗位 JD、技能要求、薪资数据，输出到 data/jobs.json

数据源:
  1. BOSS直聘 — 岗位列表 + 详情
  2. 牛客网 — 面经 + 公司讨论
  3. 拉勾网 — 岗位 JD + 技能标签
  4. 脉脉 — 公司评价 + 薪资爆料 (需登录，作为可选)

用法:
  python scraper.py                    # 抓取所有源，输出 JSON
  python scraper.py --source boss      # 只抓 BOSS直聘
  python scraper.py --update           # 增量更新已有数据
  python scraper.py --serve            # 启动定时抓取(每6小时)

输出: data/jobs.json — 前端直接读取的岗位数据

依赖: pip install requests beautifulsoup4 lxml
可选: pip install selenium webdriver-manager (用于JS渲染页面)
"""

import json
import os
import sys
import time
import hashlib
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup

# ── Config ───────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = DATA_DIR / "jobs.json"
CACHE_FILE = DATA_DIR / "scraper_cache.json"
LOG_FILE = DATA_DIR / "scraper.log"

# 请求间隔(秒)，减小对目标站点的压力
REQUEST_DELAY = 2.0
# 超时时间
TIMEOUT = 15
# 最大重试次数
MAX_RETRIES = 3

# 请求头 — 模拟正常浏览器
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

# ── Logging ───────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════
#  Utilities
# ══════════════════════════════════════════════

def ensure_dir():
    """确保数据目录存在"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def safe_request(url: str, headers: dict = None, params: dict = None,
                 use_json: bool = True, retries: int = MAX_RETRIES) -> Optional[dict | str]:
    """带重试和错误处理的安全请求"""
    h = {**HEADERS, **(headers or {})}
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=h, params=params, timeout=TIMEOUT)
            resp.raise_for_status()
            time.sleep(REQUEST_DELAY)
            return resp.json() if use_json else resp.text
        except requests.exceptions.Timeout:
            logger.warning(f"请求超时 (attempt {attempt + 1}/{retries}): {url[:80]}")
        except requests.exceptions.HTTPError as e:
            logger.warning(f"HTTP错误 {e.response.status_code} (attempt {attempt + 1}/{retries}): {url[:80]}")
            if e.response.status_code in (403, 404, 410):
                return None  # 不可恢复
        except requests.exceptions.ConnectionError:
            logger.warning(f"连接失败 (attempt {attempt + 1}/{retries}): {url[:80]}")
        except Exception as e:
            logger.warning(f"请求异常: {e} (attempt {attempt + 1}/{retries})")
        if attempt < retries - 1:
            time.sleep(2 ** attempt)  # 指数退避
    return None


def load_cache() -> dict:
    """加载抓取缓存"""
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"last_run": None, "job_data": {}, "etags": {}}


def save_cache(cache: dict):
    """保存抓取缓存"""
    cache["last_run"] = datetime.now().isoformat()
    ensure_dir()
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


# ══════════════════════════════════════════════
#  Source 1: BOSS直聘
# ══════════════════════════════════════════════

def scrape_boss(query: str = "", page: int = 1, city: str = "100010000") -> list[dict]:
    """
    抓取 BOSS直聘 岗位数据

    BOSS直聘内部 API:
    GET https://www.zhipin.com/wapi/zpgeek/search/joblist.json
      ?query={query}&city={city}&page={page}&pageSize=30

    Args:
        query: 搜索关键词 (如 "产品经理"、"前端开发")
        city: 城市编码 (100010000=全国)
        page: 页码

    Returns:
        岗位列表 [{title, company, salary, tags, jd, ...}, ...]
    """
    logger.info(f"抓取 BOSS直聘: query={query or '全部'}, page={page}")

    url = "https://www.zhipin.com/wapi/zpgeek/search/joblist.json"
    params = {
        "query": query,
        "city": city,
        "page": page,
        "pageSize": 30,
        "experience": "",   # 经验要求
        "degree": "",       # 学历要求
        "industry": "",     # 行业
    }

    data = safe_request(url, params=params)
    if not data or data.get("code") != 0:
        logger.warning(f"BOSS直聘 API 返回异常: {data}")
        return []

    jobs = []
    zp_data = data.get("zpData", {})
    job_list = zp_data.get("jobList", [])

    for item in job_list:
        try:
            job = {
                "source": "boss",
                "source_id": str(item.get("encryptJobId", "")),
                "title": item.get("jobName", ""),
                "company": item.get("brandName", ""),
                "company_logo": item.get("brandLogo", ""),
                "salary": item.get("salaryDesc", ""),
                "city": item.get("cityName", ""),
                "district": item.get("areaDistrict", ""),
                "experience": item.get("jobExperience", ""),
                "education": item.get("jobDegree", ""),
                "tags": [],
                "jd_text": "",
                "jd_url": f"https://www.zhipin.com/job_detail/{item.get('encryptJobId', '')}.html",
                "boss_title": item.get("bossTitle", ""),
                "boss_name": item.get("bossName", ""),
                "company_info": {
                    "industry": item.get("industryName", ""),
                    "scale": item.get("scaleText", ""),
                    "stage": item.get("stageText", ""),
                },
                "scraped_at": datetime.now().isoformat(),
            }

            # 解析技能标签
            skills = item.get("skills", [])
            if isinstance(skills, list):
                job["tags"] = skills
            elif isinstance(skills, str):
                job["tags"] = [s.strip() for s in skills.split(",") if s.strip()]

            # 解析福利标签
            welfare = item.get("welfare", "")
            if welfare:
                job["benefits"] = [w.strip() for w in welfare.split(",") if w.strip()]

            jobs.append(job)
        except Exception as e:
            logger.warning(f"解析 BOSS 岗位失败: {e}")
            continue

    logger.info(f"BOSS直聘: 获取 {len(jobs)} 个岗位")
    return jobs


def scrape_boss_detail(encrypt_job_id: str) -> Optional[dict]:
    """
    抓取 BOSS直聘 岗位详情页

    API: GET https://www.zhipin.com/wapi/zpgeek/job/detail.json?jobId={id}
    """
    url = "https://www.zhipin.com/wapi/zpgeek/job/detail.json"
    params = {"jobId": encrypt_job_id}

    data = safe_request(url, params=params)
    if not data or data.get("code") != 0:
        return None

    detail = data.get("zpData", {})
    return {
        "jd_text": detail.get("jobDetail", ""),
        "address": detail.get("address", ""),
        "business_scope": detail.get("businessScope", ""),
    }


def scrape_boss_multi(queries: list[str], pages: int = 2) -> list[dict]:
    """批量抓取 BOSS直聘 多个关键词的岗位"""
    all_jobs = []
    for query in queries:
        for page in range(1, pages + 1):
            jobs = scrape_boss(query=query, page=page)
            if not jobs:
                break  # 没有更多数据
            all_jobs.extend(jobs)
            if len(jobs) < 30:
                break  # 最后一页
    return all_jobs


# ══════════════════════════════════════════════
#  Source 2: 牛客网
# ══════════════════════════════════════════════

def scrape_nowcoder_discussions(company: str = "", page: int = 1) -> list[dict]:
    """
    抓取 牛客网 面经/讨论帖

    API: GET https://www.nowcoder.com/discuss?type=2&order=3&pageSize=30&page={page}
    或搜索API: https://www.nowcoder.com/search?type=post&query={company}

    注: 牛客网很多内容需要登录，这里抓取公开的面经列表
    """
    logger.info(f"抓取 牛客网: company={company}, page={page}")

    url = "https://www.nowcoder.com/discuss"
    params = {
        "type": "2",      # 面经
        "order": "3",     # 最新
        "pageSize": "30",
        "page": str(page),
    }
    if company:
        params["query"] = company

    html = safe_request(url, params=params, use_json=False)
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    posts = []

    # 牛客网改版频繁，尝试多种选择器
    discuss_items = (
        soup.select(".discuss-main") or
        soup.select(".post-list-item") or
        soup.select("[data-type='discuss']")
    )

    for item in discuss_items:
        try:
            title_el = item.select_one("a.discuss-title, .post-title a, h3 a")
            title = title_el.get_text(strip=True) if title_el else ""
            href = title_el.get("href", "") if title_el else ""

            company_el = item.select_one(".discuss-tag-company, .tag-company")
            company_name = company_el.get_text(strip=True) if company_el else ""

            posts.append({
                "source": "nowcoder",
                "title": title,
                "url": f"https://www.nowcoder.com{href}" if href.startswith("/") else href,
                "company": company_name,
                "scraped_at": datetime.now().isoformat(),
            })
        except Exception as e:
            logger.warning(f"解析 牛客 帖子失败: {e}")

    logger.info(f"牛客网: 获取 {len(posts)} 个讨论帖")
    return posts


def scrape_nowcoder_jobs(keyword: str = "") -> list[dict]:
    """
    抓取 牛客网 校招岗位信息

    牛客网校招板块: https://www.nowcoder.com/school/schedule
    API: https://www.nowcoder.com/api/school/schedule/search
    """
    logger.info(f"抓取 牛客网校招: keyword={keyword}")

    url = "https://www.nowcoder.com/api/school/schedule/search"
    data = safe_request(url, params={"keyword": keyword, "page": "1", "pageSize": "50"})
    if not data or data.get("code") != 0:
        return []

    jobs = []
    for item in data.get("data", {}).get("list", []):
        try:
            jobs.append({
                "source": "nowcoder_school",
                "title": item.get("jobName", ""),
                "company": item.get("companyName", ""),
                "city": item.get("cityName", ""),
                "salary": item.get("salary", ""),
                "recruit_type": item.get("recruitType", ""),  # 校招/实习
                "url": item.get("url", ""),
                "end_time": item.get("endTime", ""),
                "scraped_at": datetime.now().isoformat(),
            })
        except Exception as e:
            logger.warning(f"解析 牛客 校招岗位失败: {e}")

    logger.info(f"牛客网校招: 获取 {len(jobs)} 个岗位")
    return jobs


# ══════════════════════════════════════════════
#  Source 3: 拉勾网
# ══════════════════════════════════════════════

def scrape_lagou(keyword: str = "", city: str = "全国", page: int = 1) -> list[dict]:
    """
    抓取 拉勾网 岗位数据

    拉勾网 API:
    POST https://www.lagou.com/wn/jobs
      Body: { "city": "全国", "kd": "产品经理", "pn": 1 }

    注: 拉勾网反爬虫严重，大概率需要 Cookie + 验证码
    此处提供基础实现，生产使用建议配合 selenium
    """
    logger.info(f"抓取 拉勾网: keyword={keyword}, page={page}")

    url = "https://www.lagou.com/wn/jobs"
    headers = {
        **HEADERS,
        "Content-Type": "application/json",
        "Referer": "https://www.lagou.com/",
        "Origin": "https://www.lagou.com",
    }
    body = {
        "city": city,
        "kd": keyword,
        "pn": page,
        "needAddtionalResult": False,
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(url, headers=headers, json=body, timeout=TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
            time.sleep(REQUEST_DELAY)

            if not data.get("success"):
                logger.warning(f"拉勾 API 返回失败: {data.get('msg', 'unknown')}")
                if "验证" in data.get("msg", "") or "登录" in data.get("msg", ""):
                    logger.error("拉勾网需要验证/登录，跳过此源")
                    return []
                continue

            jobs = []
            results = data.get("content", {}).get("positionResult", {}).get("result", [])
            for item in results:
                try:
                    jobs.append({
                        "source": "lagou",
                        "source_id": str(item.get("positionId", "")),
                        "title": item.get("positionName", ""),
                        "company": item.get("companyFullName", ""),
                        "company_logo": item.get("companyLogo", ""),
                        "salary": item.get("salary", ""),
                        "city": item.get("city", ""),
                        "district": item.get("district", ""),
                        "education": item.get("education", ""),
                        "experience": item.get("workYear", ""),
                        "tags": item.get("positionLables", []) or item.get("skillLables", []),
                        "jd_text": item.get("positionDetail", ""),
                        "jd_url": f"https://www.lagou.com/jobs/{item.get('positionId', '')}.html",
                        "benefits": item.get("positionAdvantage", ""),
                        "company_info": {
                            "industry": item.get("industryField", ""),
                            "scale": item.get("companySize", ""),
                            "stage": item.get("financeStage", ""),
                        },
                        "scraped_at": datetime.now().isoformat(),
                    })
                except Exception as e:
                    logger.warning(f"解析 拉勾 岗位失败: {e}")

            logger.info(f"拉勾网: 获取 {len(jobs)} 个岗位")
            return jobs

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                logger.warning("拉勾网 403 禁止访问，可能需要更换IP或使用代理")
                break
            logger.warning(f"拉勾网 HTTP {e.response.status_code}")
        except Exception as e:
            logger.warning(f"拉勾网请求失败: {e}")

        if attempt < MAX_RETRIES - 1:
            time.sleep(3)

    return []


# ══════════════════════════════════════════════
#  Source 4: 脉脉 (可选)
# ══════════════════════════════════════════════

def scrape_maimai_company_reviews(company_name: str) -> Optional[dict]:
    """
    抓取 脉脉 公司评价和薪资数据

    注: 脉脉需要登录态，此函数仅为框架占位。
    实际使用需要:
    1. 先模拟登录获取 Cookie
    2. 使用 Cookie 请求 API
    3. 或使用 selenium 自动化登录

    API: https://maimai.cn/api/company/review
    """
    logger.info(f"脉脉数据抓取未实现 (需要登录): company={company_name}")
    # TODO: 实现脉脉登录和数据抓取
    # 参考流程:
    # 1. selenium 打开 https://maimai.cn
    # 2. 扫码或短信登录
    # 3. 保存 Cookie
    # 4. 使用 Cookie 请求内部 API
    return None


# ══════════════════════════════════════════════
#  Source 5: 补充数据 — 行业报告/招聘趋势
# ══════════════════════════════════════════════

def scrape_salary_trends() -> dict:
    """
    从公开数据源获取薪资趋势

    数据源:
    - 国家统计局 分行业平均工资
    - 各大招聘平台年度报告
    - 这里使用预置的行业薪资基准数据作为兜底
    """
    # 基于公开报告的行业薪资基准 (2024-2025, 单位: K/月, 应届生)
    return {
        "互联网/科技": {"low": 10, "mid": 18, "high": 30, "growth": "+8%"},
        "金融/投资": {"low": 12, "mid": 20, "high": 35, "growth": "+5%"},
        "公务员/事业编": {"low": 6, "mid": 10, "high": 15, "growth": "+3%"},
        "国企/央企": {"low": 8, "mid": 13, "high": 20, "growth": "+4%"},
        "快消/零售": {"low": 8, "mid": 14, "high": 22, "growth": "+5%"},
        "咨询/四大": {"low": 12, "mid": 20, "high": 35, "growth": "+6%"},
        "制造业": {"low": 7, "mid": 12, "high": 20, "growth": "+4%"},
        "教育/培训": {"low": 6, "mid": 10, "high": 18, "growth": "+2%"},
        "医疗/医药": {"low": 8, "mid": 14, "high": 25, "growth": "+7%"},
        "广告/传媒": {"low": 6, "mid": 10, "high": 18, "growth": "+3%"},
        "游戏/娱乐": {"low": 10, "mid": 16, "high": 28, "growth": "+6%"},
    }


# ══════════════════════════════════════════════
#  Data Processing
# ══════════════════════════════════════════════

def normalize_job(job: dict) -> dict:
    """
    将不同来源的岗位数据统一为标准格式，与前端 JOB_DATABASE 兼容
    """
    title = job.get("title", "")
    return {
        "id": hashlib.md5(f"{job.get('source','')}_{job.get('source_id','')}_{title}".encode()).hexdigest()[:12],
        "title": title,
        "industry": job.get("company_info", {}).get("industry", "") or guess_industry(title),
        "company": job.get("company", ""),
        "salary": job.get("salary", ""),
        "city": job.get("city", ""),
        "tags": job.get("tags", [])[:6],
        "jd_text": job.get("jd_text", ""),
        "jd_url": job.get("jd_url", ""),
        "education": job.get("education", ""),
        "experience": job.get("experience", ""),
        "benefits": job.get("benefits", []),
        "source": job.get("source", ""),
        "scraped_at": job.get("scraped_at", ""),
    }


def guess_industry(title: str) -> str:
    """根据岗位名称推测行业"""
    title_lower = title.lower()
    if any(k in title_lower for k in ["产品经理", "前端", "后端", "java", "python", "算法", "数据", "运营", "测试"]):
        return "互联网/科技"
    if any(k in title_lower for k in ["投资", "金融", "行研", "量化", "风控", "银行"]):
        return "金融/投资"
    if any(k in title_lower for k in ["管培", "品牌", "市场", "营销", "销售"]):
        return "快消/零售"
    if any(k in title_lower for k in ["咨询", "顾问", "审计"]):
        return "咨询/四大"
    if any(k in title_lower for k in ["公务员", "事业编", "选调"]):
        return "公务员/事业编"
    if any(k in title_lower for k in ["游戏", "策划", "美术"]):
        return "游戏/娱乐"
    if any(k in title_lower for k in ["新媒体", "编辑", "记者", "设计", "视频"]):
        return "广告/传媒"
    if any(k in title_lower for k in ["hr", "人力", "招聘"]):
        return "全行业"
    return "其他"


def merge_jobs(scraped: list[dict], existing: list[dict] = None) -> list[dict]:
    """
    合并新旧数据:
    - 新数据覆盖旧数据 (按 source + source_id 去重)
    - 保留未被更新的旧数据
    """
    merged = {}
    for job in (existing or []):
        key = f"{job.get('source', '')}_{job.get('source_id', '')}"
        merged[key] = job
    for job in scraped:
        key = f"{job.get('source', '')}_{job.get('source_id', '')}"
        merged[key] = job
    return list(merged.values())


# ══════════════════════════════════════════════
#  Main Entry
# ══════════════════════════════════════════════

def run_full_scrape(update: bool = False) -> dict:
    """执行全量抓取"""
    ensure_dir()

    # 目标搜索关键词 — 覆盖主要岗位方向
    queries = [
        # 互联网/科技
        "产品经理", "前端开发", "后端开发", "数据分析师",
        "算法工程师", "产品运营", "测试工程师",
        # 金融
        "行业研究", "投资分析师", "金融科技",
        # 快消/咨询
        "管理培训生", "市场营销", "咨询顾问",
        # 其他
        "人力资源", "游戏策划", "新媒体运营", "供应链",
    ]

    logger.info(f"开始全量抓取，{len(queries)} 个关键词...")

    all_jobs = []

    # ── BOSS直聘 ──
    logger.info("=== BOSS直聘 ===")
    try:
        boss_jobs = scrape_boss_multi(queries, pages=2)
        all_jobs.extend(boss_jobs)
        logger.info(f"BOSS直聘总计: {len(boss_jobs)} 个岗位")
    except Exception as e:
        logger.error(f"BOSS直聘抓取失败: {e}")

    # ── 牛客网校招 ──
    logger.info("=== 牛客网校招 ===")
    try:
        for q in queries[:8]:  # 只抓部分关键词避免请求过多
            nc_jobs = scrape_nowcoder_jobs(q)
            all_jobs.extend(nc_jobs)
    except Exception as e:
        logger.error(f"牛客网抓取失败: {e}")

    # ── 拉勾网 ──
    logger.info("=== 拉勾网 ===")
    try:
        for q in queries[:5]:  # 拉勾反爬严格，少抓一些
            lagou_jobs = scrape_lagou(q)
            all_jobs.extend(lagou_jobs)
    except Exception as e:
        logger.error(f"拉勾网抓取失败: {e}")

    # ── 标准化 ──
    normalized = [normalize_job(j) for j in all_jobs]

    # ── 去重 ──
    seen = set()
    unique = []
    for job in normalized:
        if job["id"] not in seen:
            seen.add(job["id"])
            unique.append(job)

    # ── 合并已有数据 ──
    if update:
        existing = []
        if OUTPUT_FILE.exists():
            try:
                existing = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        unique = merge_jobs(unique, existing)

    # ── 添加薪资基准数据 ──
    salary_data = scrape_salary_trends()

    # ── 输出 ──
    output = {
        "meta": {
            "version": "2.0",
            "scraped_at": datetime.now().isoformat(),
            "total_jobs": len(unique),
            "sources": {
                "boss": sum(1 for j in unique if j.get("source") == "boss"),
                "nowcoder": sum(1 for j in unique if "nowcoder" in (j.get("source") or "")),
                "lagou": sum(1 for j in unique if j.get("source") == "lagou"),
            },
            "queries_used": queries,
        },
        "salary_benchmarks": salary_data,
        "jobs": unique,
    }

    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info(f"\n✅ 抓取完成! 共 {len(unique)} 个岗位")
    logger.info(f"   输出文件: {OUTPUT_FILE}")
    logger.info(f"   数据来源: BOSS直聘({output['meta']['sources']['boss']}) "
                f"牛客({output['meta']['sources']['nowcoder']}) "
                f"拉勾({output['meta']['sources']['lagou']})")

    return output


def run_serve_mode(interval_hours: int = 6):
    """定时抓取模式"""
    logger.info(f"启动定时抓取模式，间隔 {interval_hours} 小时")
    while True:
        try:
            run_full_scrape(update=True)
        except Exception as e:
            logger.error(f"定时抓取出错: {e}")
        next_run = datetime.now() + timedelta(hours=interval_hours)
        logger.info(f"下次抓取: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")
        time.sleep(interval_hours * 3600)


# ── CLI ───────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Career Destiny — 岗位数据爬虫")
    parser.add_argument("--source", choices=["boss", "nowcoder", "lagou", "all"],
                        default="all", help="数据源 (default: all)")
    parser.add_argument("--update", action="store_true", help="增量更新已有数据")
    parser.add_argument("--serve", action="store_true", help="定时抓取模式")
    parser.add_argument("--interval", type=int, default=6, help="定时抓取间隔(小时, default: 6)")

    args = parser.parse_args()

    if args.serve:
        run_serve_mode(args.interval)
    elif args.source == "all":
        run_full_scrape(update=args.update)
    elif args.source == "boss":
        jobs = scrape_boss_multi(["产品经理", "前端开发", "数据分析师", "算法工程师",
                                   "管理培训生", "咨询顾问", "游戏策划"], pages=2)
        normalized = [normalize_job(j) for j in jobs]
        ensure_dir()
        OUTPUT_FILE.write_text(json.dumps({
            "meta": {"source": "boss", "scraped_at": datetime.now().isoformat(), "total": len(normalized)},
            "jobs": normalized,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info(f"✅ BOSS直聘: {len(normalized)} 个岗位")
    elif args.source == "nowcoder":
        jobs = scrape_nowcoder_jobs()
        normalized = [normalize_job(j) for j in jobs]
        ensure_dir()
        OUTPUT_FILE.write_text(json.dumps({
            "meta": {"source": "nowcoder", "scraped_at": datetime.now().isoformat(), "total": len(normalized)},
            "jobs": normalized,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info(f"✅ 牛客网: {len(normalized)} 个岗位")
    elif args.source == "lagou":
        jobs = scrape_lagou("产品经理")
        normalized = [normalize_job(j) for j in jobs]
        ensure_dir()
        OUTPUT_FILE.write_text(json.dumps({
            "meta": {"source": "lagou", "scraped_at": datetime.now().isoformat(), "total": len(normalized)},
            "jobs": normalized,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info(f"✅ 拉勾网: {len(normalized)} 个岗位")
