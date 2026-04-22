const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 净化函数：移除广告、版权、尾页
function cleanHtml(html, options = { removeAds: true, removeCopyright: true, removeFooter: true }) {
    const $ = cheerio.load(html);
    
    if (options.removeAds) {
        $('.ad, .ads, .advertisement, [id*=ad], [class*=ad], [id*=google_ads], .banner-ad, [class*=banner]').remove();
    }
    
    if (options.removeCopyright) {
        $('[class*=copyright], [id*=copyright], [class*=copy-right], footer:contains("版权所有"), div:contains("ICP备"), [class*=license]').remove();
    }
    
    if (options.removeFooter) {
        $('footer, .footer, [class*=footer], [id*=footer], .bottom-nav, .page-footer, [class*=bottom]').remove();
    }
    
    return $.html();
}

// API 接口 - 只返回 JSON
app.post('/api/clean', async (req, res) => {
    const { url, removeAds, removeCopyright, removeFooter } = req.body;
    
    // 只允许 JSON 请求
    if (!req.headers.accept || !req.headers.accept.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json');
    }
    
    if (!url) {
        return res.status(400).json({ error: 'URL不能为空' });
    }
    
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const cleanedHtml = cleanHtml(response.data, { removeAds, removeCopyright, removeFooter });
        
        // 始终返回 JSON
        res.json({
            success: true,
            originalUrl: url,
            cleanedHtml: cleanedHtml,
            title: cheerio.load(response.data)('title').text() || '无标题'
        });
    } catch (error) {
        res.status(500).json({ error: '获取网页失败：' + error.message });
    }
});

// 健康检查接口（可选）
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app;
