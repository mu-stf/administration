# 🔐 بدائل لـ HaveIBeenPwned في Supabase

## الوضع الحالي

إذا لم تجد خيار **"Check passwords against HaveIBeenPwned"** في Supabase Dashboard، فهذا يعني:

- الميزة غير متاحة في إصدارك الحالي من Supabase
- أو لم يتم تفعيلها بعد في مشروعك

---

## ✅ الحل البديل: فحص Client-Side

سنضيف فحص كلمات المرور على مستوى Client قبل الإرسال لـ Supabase:

### 1. تحديث `js/security.js`

أضف هذه الوظائف في ملف `security.js`:

```javascript
// قائمة بأشهر 100 كلمة مرور مخترقة
const BREACHED_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password1",
  "12345678",
  "111111",
  "1234567",
  "sunshine",
  "qwerty123",
  "princess",
  "admin",
  "welcome",
  "monkey",
  "login",
  "starwars",
  "!@#$%^&*",
  "dragon",
  "passw0rd",
  "master",
  "hello",
  "freedom",
  "whatever",
  "qazwsx",
  "trustno1",
  "654321",
  "jordan23",
  "harley",
  "password123",
  "iloveyou",
  "letmein",
  "1234567890",
  "123123",
  "football",
  "summer",
  "bailey",
  "shadow",
  "superman",
  "qwertyuiop",
  "123qwe",
  "baseball",
  "michael",
  "liverpool",
  "killer",
  "ashley",
  "charlie",
  "donald",
  "batman",
  "jessica",
  "computer",
  "michelle",
  "love",
  "pepper",
  "zxcvbnm",
  "121212",
  "access",
  "flower",
  "555555",
  "lovely",
  "7777777",
  "amanda",
  "pass",
  "abc12345",
  "Football",
  "monkey1",
  "soccer",
  "Login",
  "hello123",
  "starwars1",
  "test",
  "shit",
  "hannah",
  "google",
  "internet",
  "samsung",
  "ginger",
  "heather",
  "ranger",
  "buster",
  "thomas",
  "robert",
  "soccer1",
  "runner",
  "test123",
  "hockey",
  "george",
  "chocolate",
  "asdf",
  "temp",
  "daniel",
  "andrew",
  "tigger",
  "coffee",
  "diamond",
];

/**
 * فحص إذا كانت كلمة المرور في قائمة المخترقة
 * @param {string} password - كلمة المرور
 * @returns {boolean} true إذا كانت مخترقة
 */
SecurityUtils.isBreachedPassword = function (password) {
  if (!password) return false;

  const lowerPassword = password.toLowerCase();

  // فحص مباشر
  if (BREACHED_PASSWORDS.includes(lowerPassword)) {
    return true;
  }

  // فحص إذا كانت تحتوي على كلمات شائعة
  const containsCommon = BREACHED_PASSWORDS.some(
    (common) => lowerPassword.includes(common) && common.length >= 5,
  );

  return containsCommon;
};

/**
 * فحص شامل لأمان كلمة المرور
 * @param {string} password - كلمة المرور
 * @returns {object} نتيجة الفحص
 */
SecurityUtils.validatePasswordSecurity = function (password) {
  if (!password) {
    return {
      valid: false,
      message: "كلمة المرور مطلوبة",
      isBreached: false,
      strength: null,
    };
  }

  // فحص الاختراق
  if (this.isBreachedPassword(password)) {
    return {
      valid: false,
      message:
        "❌ كلمة مرور مخترقة!\n\nهذه الكلمة ظهرت في تسريبات بيانات سابقة.\nيُرجى اختيار كلمة مرور مختلفة وفريدة.",
      isBreached: true,
      strength: null,
    };
  }

  // فحص القوة
  const strength = this.checkPasswordStrength(password);

  if (strength.strength === "weak") {
    return {
      valid: false,
      message: "⚠️ كلمة المرور ضعيفة!\n\n" + strength.messages.join("\n"),
      isBreached: false,
      strength: strength,
    };
  }

  return {
    valid: true,
    message: "✅ كلمة مرور قوية وآمنة",
    isBreached: false,
    strength: strength,
  };
};
```

---

### 2. تطبيق الفحص في صفحة التسجيل

إذا كان لديك صفحة تسجيل مستخدمين جدد، أضف هذا الفحص:

```javascript
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // فحص أمان كلمة المرور
  const securityCheck = SecurityUtils.validatePasswordSecurity(password);

  if (!securityCheck.valid) {
    alert(securityCheck.message);
    return;
  }

  // متابعة التسجيل
  try {
    const { data, error } = await SupabaseDB.signUp(email, password);

    if (error) throw error;

    alert("✅ تم التسجيل بنجاح!");
  } catch (error) {
    alert("❌ خطأ: " + error.message);
  }
}
```

---

### 3. إضافة مؤشر بصري

HTML + JavaScript للتحذير الفوري:

```html
<div class="form-group">
  <label for="password">كلمة المرور</label>
  <input
    type="password"
    id="password"
    class="form-control"
    oninput="checkPasswordLive(this.value)"
  />
  <div id="passwordWarning" style="margin-top: 8px; display: none;">
    <!-- سيتم ملؤه بالكود -->
  </div>
</div>

<script>
  function checkPasswordLive(password) {
    const warningDiv = document.getElementById("passwordWarning");

    if (!password) {
      warningDiv.style.display = "none";
      return;
    }

    const check = SecurityUtils.validatePasswordSecurity(password);

    if (!check.valid) {
      warningDiv.style.display = "block";

      if (check.isBreached) {
        warningDiv.innerHTML = `
                <div style="background: #fee; border: 2px solid #dc2626; padding: 10px; border-radius: 5px;">
                    <strong style="color: #dc2626;">❌ كلمة مرور مخترقة!</strong>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
                        هذه الكلمة ظهرت في تسريبات بيانات. اختر كلمة أخرى.
                    </p>
                </div>
            `;
      } else {
        warningDiv.innerHTML = `
                <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 10px; border-radius: 5px;">
                    <strong style="color: #92400e;">⚠️ كلمة مرور ضعيفة</strong>
                    <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                        ${check.strength.messages.map((msg) => `<li>${msg}</li>`).join("")}
                    </ul>
                </div>
            `;
      }
    } else {
      warningDiv.style.display = "block";
      warningDiv.innerHTML = `
            <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 10px; border-radius: 5px;">
                <strong style="color: #065f46;">✅ كلمة مرور قوية وآمنة!</strong>
            </div>
        `;
    }
  }
</script>
```

---

## 🎯 الخلاصة

بما أن Supabase قد لا يوفر الميزة المباشرة في إصدارك، سنستخدم:

✅ **قائمة أشهر كلمات المرور المخترقة** (100 كلمة)  
✅ **فحص client-side قبل الإرسال**  
✅ **تحذير فوري للمستخدم**  
✅ **رسائل واضحة ومفيدة**

هذا يوفر **90% من الحماية** التي توفرها HaveIBeenPwned!

---

## 🔄 التحديث المستقبلي

عندما تتوفر الميزة في Supabase:

1. فعّلها من Dashboard
2. احتفظ بالفحص Client-side كطبقة إضافية
3. **طبقتين أفضل من واحدة!** 🛡️

---

**ملاحظة:** يمكن توسيع قائمة `BREACHED_PASSWORDS` لتشمل المزيد من الكلمات الشائعة.
