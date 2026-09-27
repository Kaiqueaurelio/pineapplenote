# Acesso e perfil do Pineapple Note

## Implementação
- Criar uma tela pública de acesso e cadastro com e-mail e senha ou Google.
- Exigir a confirmação do e-mail antes de liberar a conta e informar claramente o próximo passo após o cadastro.
- Incluir recuperação de senha e uma página pública para definir a nova senha.
- Proteger a central de estudos para usuários autenticados e oferecer saída segura pelo avatar.
- Criar perfil acadêmico individual com nome, instituição e curso, acessível nas configurações.
- Usar permissões para que cada pessoa veja e altere somente o próprio perfil.
- Validar cadastro, login, estados de confirmação e apresentação em celular e computador.

## Detalhes técnicos
- Lovable Cloud fornecerá autenticação, banco de dados e proteção dos perfis.
- A confirmação será enviada para qualquer endereço informado, conforme solicitado; não haverá filtro por domínio institucional.
- Proteção contra senhas vazadas e exigência da senha atual em trocas feitas dentro da conta ficarão ativas.
