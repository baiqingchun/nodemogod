## 用户管理

对用户进行注册和修改。

### 用户数据

username	string	用户ID

access	    string	微信或者微博登录需要的信息（如果是手机登录，那么为空）

nickname	string	用户显示在界面上的名字

avatar	    string	用户头像，可为imgN表示默认用户头像，或 http://XXXXX 表示微信微博链接的头像

info	    String	用户签名信息

priv	    int	    "<=0: 被封禁
                    1: 普通用户
                    2: 管理员
                    3: 超级管理员"

company	    string	企业ID


## auth 文件


验证用户的各种行为
BODY:
{a: 2}

Return:
{code: 300, result: {} }



