const config = (ctx) => {
    let userConfig = ctx.getConfig('picBed.oceanpic-uploader')
    if (!userConfig) {
        userConfig = {
            token: "",
            allowCompress: 1,
            allowDistribute: 1
        }
    }
    const config = [
        {
            name: 'token',
            type: 'input',
            default: userConfig.token || '',
            message: 'API KEY',
            required: true
        },
        {
            name: 'allowCompress',
            type: 'list',
            default: userConfig.allowCompress || 1,
            required: false,
            choices: [{
                name: '允许压缩（高速）',
                value: 1
            }, {
                name: '原图（慢）',
                value: 0
            }]
        },
        {
            name: 'allowDistribute',
            type: 'list',
            default: userConfig.allowDistribute || 1,
            required: false,
            choices: [{
                name: '允许分发（高速）',
                value: 1
            }, {
                name: '不允许分发（慢）',
                value: 0
            }]
        }
    ]
    return config
}


const postOptions = (fileName, image, apiToken, allowCompass, allowDistribute) => {
    return {
        method: 'POST',
        url: 'http://img.codesocean.top/upload/img',
        headers: {
            contentType: 'multipart/form-data',
            'User-Agent': 'PicGo',
            apikey: apiToken
        },
        formData: {
            img: {
                'value': image,
                'options': {
                    'filename': fileName
                }
            },
            allowCompass: allowCompass,
            allowDistribute: allowDistribute
        }
    }
}



const handle = async (ctx) => {
    //获取用户配置信息
    const userConfig = ctx.getConfig('picBed.oceanpic-uploader')
    if (!userConfig) {
        throw new Error('未配置参数，请配置OceanPic上传参数。')
    }
    try {
        //获取图片输出缓存
        const imgList = ctx.output
        for (let img of imgList) {
            if (img.fileName && img.buffer) {
                let image = img.buffer;
                if (!image && img.base64Image) {
                    image = Buffer.from(img.base64Image, 'base64')
                }
                const postConfig = postOptions(img.fileName, image, userConfig.token, userConfig.allowCompass, userConfig.allowDistribute)
                let response = await ctx.Request.request(postConfig);
                response = JSON.parse(response);
                if (response.msg === "success") {
                    delete img.base64Image;
                    delete img.buffer;
                    img['imgUrl'] = response.url;
                } else {
                    throw new Error('Upload failed');
                }
            }
        }
        return ctx;
    } catch (err) {
        if (err.error === 'Upload failed') {
            ctx.emit('notification', {
                title: '上传失败！',
                body: '请检查你的配置项是否正确'
            })
        } else {
            ctx.emit('notification', {
                title: '上传失败！',
                body: '请检查你的配置项是否正确'
            })
        }
        throw err
    }
}


module.exports = (ctx) => {
    const register = () => {
        ctx.log.success('OceanPic插件加载成功。')
        ctx.helper.uploader.register('oceanpic-uploader', {
            handle: handle,
            config: config,
            name: 'OceanPic'
        })
    }
    return {
        register,
        uploader: 'oceanpic-uploader'
    }
}